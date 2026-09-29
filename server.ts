import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.ts';
import { hindsightService } from './server/services/hindsightService.ts';
import { geminiService } from './server/services/geminiService.ts';
import { analysisService } from './server/services/analysisService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- System Status & Connectivity ---
app.get('/api/status', (req: Request, res: Response) => {
  const dbStatus = db.getStatus();
  const hindsightStatus = hindsightService.getStatus();
  const geminiStatus = geminiService.getStatus();

  res.json({
    database: dbStatus,
    hindsight: hindsightStatus,
    gemini: geminiStatus,
    serverTime: new Date().toISOString(),
  });
});

// --- Settings: Update Hindsight Credentials ---
app.post('/api/settings/hindsight', (req: Request, res: Response) => {
  const { apiKey, bankId, baseUrl } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'HINDSIGHT_API_KEY is required.' });
  }
  const result = hindsightService.updateCredentials(apiKey, bankId, baseUrl);
  res.json({
    ...result,
    status: hindsightService.getStatus(),
  });
});

// --- Departments ---
app.get('/api/departments', async (req: Request, res: Response) => {
  try {
    const list = await db.getDepartments();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/departments', async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required.' });
    }
    const dept = await db.createDepartment(name, code, description);
    res.json(dept);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Historical Projects & Experiences ---
app.get('/api/historical-projects', async (req: Request, res: Response) => {
  try {
    const list = await db.getHistoricalProjects();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/historical-projects/:id', async (req: Request, res: Response) => {
  try {
    const item = await db.getHistoricalProjectById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Project not found' });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/experiences/:id', async (req: Request, res: Response) => {
  try {
    const item = await db.getHistoricalExperienceById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Historical experience not found' });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Gemini Extraction: Natural language into structured experience preview
app.post('/api/extract/experience', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required for extraction.' });
    }
    const extracted = await geminiService.extractHistoricalExperience(text);
    res.json(extracted);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gemini extraction failed.' });
  }
});

// Duplicate Prevention Check
app.post('/api/check-duplicate', async (req: Request, res: Response) => {
  try {
    const { projectName, problemGoal, whatWasAttempted } = req.body;
    const result = db.checkDuplicateExperience(projectName || '', problemGoal || '', whatWasAttempted || '');
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Save Historical Experience and Retain in Hindsight
app.post('/api/historical-projects', async (req: Request, res: Response) => {
  try {
    const { project, experience, allowDuplicate } = req.body;
    if (!project || !experience) {
      return res.status(400).json({ error: 'Project and experience details are required.' });
    }

    // Check duplicate unless explicitly allowed by user
    if (!allowDuplicate) {
      const dup = db.checkDuplicateExperience(project.name, experience.problemGoal, experience.whatWasAttempted);
      if (dup.isDuplicate) {
        return res.status(409).json({
          duplicateFound: true,
          message: 'Similar historical experience already exists.',
          reason: dup.reason,
          existingProject: dup.existingProject,
          existingExperience: dup.existingExperience,
        });
      }
    }

    // Step 1: Save structured record to database
    const saved = await db.createHistoricalProjectAndExperience(project, experience);

    // Step 2: Retain in Hindsight
    const hindsightStatus = hindsightService.getStatus();
    let retainResult: any = null;

    if (hindsightStatus.isAvailable) {
      retainResult = await hindsightService.retainHistoricalExperience({
        experienceId: saved.experience.id,
        projectName: saved.project.name,
        department: project.departmentId,
        status: saved.project.status,
        problemGoal: saved.experience.problemGoal,
        whatWasAttempted: saved.experience.whatWasAttempted,
        approachUsed: saved.experience.approachUsed,
        whatHappened: saved.experience.whatHappened,
        whatWorked: saved.experience.whatWorked,
        whatFailed: saved.experience.whatFailed,
        whyItFailed: saved.experience.whyItFailed,
        rootCause: saved.experience.rootCause,
        constraints: saved.experience.constraints,
        lessonsLearned: saved.experience.lessonsLearned,
        futureConditions: saved.experience.futureConditions,
        source: saved.experience.source,
      });

      if (retainResult.success) {
        await db.updateExperienceHindsightStatus(saved.experience.id, 'SYNCED', retainResult.memoryId);
        saved.experience.hindsightSyncStatus = 'SYNCED';
        saved.experience.hindsightMemoryId = retainResult.memoryId;
      } else {
        await db.updateExperienceHindsightStatus(saved.experience.id, 'FAILED', undefined, retainResult.error);
        saved.experience.hindsightSyncStatus = 'FAILED';
        saved.experience.hindsightSyncError = retainResult.error;
      }
    } else {
      await db.updateExperienceHindsightStatus(
        saved.experience.id,
        'FAILED',
        undefined,
        'Hindsight credentials not configured on server.'
      );
      saved.experience.hindsightSyncStatus = 'FAILED';
      saved.experience.hindsightSyncError = 'Hindsight credentials not configured on server.';
    }

    res.json({
      project: saved.project,
      experience: saved.experience,
      hindsight: retainResult || {
        success: false,
        statusMessage: 'Saved locally, but organizational memory synchronization failed (Hindsight unconfigured).',
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Retry Hindsight Sync
app.post('/api/experiences/:id/retry-hindsight-sync', async (req: Request, res: Response) => {
  try {
    const exp = await db.getHistoricalExperienceById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Experience not found' });

    const retainResult = await hindsightService.retainHistoricalExperience({
      experienceId: exp.id,
      projectName: exp.project.name,
      status: exp.project.status,
      problemGoal: exp.problemGoal,
      whatWasAttempted: exp.whatWasAttempted,
      approachUsed: exp.approachUsed,
      whatHappened: exp.whatHappened,
      whatWorked: exp.whatWorked,
      whatFailed: exp.whatFailed,
      whyItFailed: exp.whyItFailed,
      rootCause: exp.rootCause,
      constraints: exp.constraints,
      lessonsLearned: exp.lessonsLearned,
      futureConditions: exp.futureConditions,
      source: exp.source,
    });

    if (retainResult.success) {
      const updated = await db.updateExperienceHindsightStatus(exp.id, 'SYNCED', retainResult.memoryId);
      res.json({ success: true, experience: updated, message: 'Successfully synced to Hindsight.' });
    } else {
      const updated = await db.updateExperienceHindsightStatus(exp.id, 'FAILED', undefined, retainResult.error);
      res.status(400).json({ success: false, experience: updated, error: retainResult.error });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Documents ---
app.get('/api/documents', async (req: Request, res: Response) => {
  try {
    const docs = await db.getDocuments();
    res.json(docs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/documents', async (req: Request, res: Response) => {
  try {
    const { name, documentType, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Document name and content are required.' });
    }
    const doc = await db.createDocument(name, documentType || 'Project Report', content);
    res.json(doc);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/documents/:id/extract', async (req: Request, res: Response) => {
  try {
    const docs = await db.getDocuments();
    const doc = docs.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const extracted = await geminiService.extractHistoricalExperience(doc.content);
    await db.updateDocumentExtraction(doc.id, JSON.stringify(extracted), 'EXTRACTED');
    res.json({ document: doc, extracted });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Proposals ---
app.get('/api/proposals', async (req: Request, res: Response) => {
  try {
    const list = await db.getProposals();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/proposals/:id', async (req: Request, res: Response) => {
  try {
    const item = await db.getProposalById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Proposal not found' });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/extract/proposal', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required for extraction.' });
    }
    const extracted = await geminiService.extractProposal(text);
    res.json(extracted);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/proposals', async (req: Request, res: Response) => {
  try {
    const proposalData = req.body;
    if (!proposalData.title || !proposalData.problemBeingSolved || !proposalData.proposedSolution) {
      return res.status(400).json({ error: 'Title, problem being solved, and proposed solution are required.' });
    }
    const created = await db.createProposal(proposalData);
    res.json(created);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Run Precedent Analysis Pipeline
app.post('/api/proposals/:id/analyze', async (req: Request, res: Response) => {
  try {
    const result = await analysisService.runPrecedentAnalysis(req.params.id);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get Latest Precedent Report for Proposal
app.get('/api/proposals/:id/precedent-report', async (req: Request, res: Response) => {
  try {
    const report = await db.getLatestAnalysisForProposal(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'No precedent report found for this proposal. Please run analysis first.' });
    }
    res.json(report);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Record Human Decision
app.post('/api/proposals/:id/decision', async (req: Request, res: Response) => {
  try {
    const { decision, decisionMaker, reason, conditions, additionalNotes } = req.body;
    if (!decision || !decisionMaker || !reason) {
      return res.status(400).json({ error: 'Decision, decision maker, and reason are required.' });
    }

    const record = await db.recordDecision({
      proposalId: req.params.id,
      decision,
      decisionMaker,
      reason,
      conditions,
      additionalNotes,
    });

    res.json(record);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Record Proposal Outcome (The Critical Feedback Loop!)
app.post('/api/proposals/:id/outcome', async (req: Request, res: Response) => {
  try {
    const {
      actualResult,
      whatHappened,
      didPredictedRiskOccur,
      assumptionsCorrect,
      assumptionsWrong,
      whatWorked,
      whatFailed,
      actualRootCause,
      finalLesson,
      futureAdvice,
    } = req.body;

    const proposal = await db.getProposalById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    // Step 1: Create a new HistoricalProject and Experience from this real outcome
    const newProjectData = {
      name: proposal.title,
      departmentId: proposal.departmentId,
      projectType: proposal.technologyApproach || 'Initiative',
      startDate: proposal.createdAt.slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      status: actualResult as any,
      problemGoal: proposal.problemBeingSolved,
    };

    const newExperienceData = {
      problemGoal: proposal.problemBeingSolved,
      whatWasAttempted: proposal.proposedSolution,
      approachUsed: proposal.technologyApproach,
      whatHappened,
      whatWorked,
      whatFailed,
      whyItFailed: actualResult === 'Failed' || actualResult === 'Cancelled' ? whatFailed : undefined,
      rootCause: actualRootCause,
      constraints: proposal.dependencies,
      lessonsLearned: finalLesson,
      futureConditions: futureAdvice,
      source: `Outcome of Proposal "${proposal.title}" (Recorded ${new Date().toISOString().slice(0, 10)})`,
    };

    const { project: createdProject, experience: createdExp } = await db.createHistoricalProjectAndExperience(newProjectData, newExperienceData);

    // Step 2: Retain this new experience in Hindsight
    const hindsightStatus = hindsightService.getStatus();
    let retainResult: any = null;
    let syncStatus: 'PENDING' | 'SYNCED' | 'FAILED' = 'PENDING';
    let memoryId: string | undefined = undefined;
    let syncError: string | undefined = undefined;

    if (hindsightStatus.isAvailable) {
      retainResult = await hindsightService.retainHistoricalExperience({
        experienceId: createdExp.id,
        projectName: createdProject.name,
        department: createdProject.departmentId,
        status: createdProject.status,
        problemGoal: createdExp.problemGoal,
        whatWasAttempted: createdExp.whatWasAttempted,
        approachUsed: createdExp.approachUsed,
        whatHappened: createdExp.whatHappened,
        whatWorked: createdExp.whatWorked,
        whatFailed: createdExp.whatFailed,
        whyItFailed: createdExp.whyItFailed,
        rootCause: createdExp.rootCause,
        constraints: createdExp.constraints,
        lessonsLearned: createdExp.lessonsLearned,
        futureConditions: createdExp.futureConditions,
        source: createdExp.source,
      });

      if (retainResult.success) {
        syncStatus = 'SYNCED';
        memoryId = retainResult.memoryId;
        await db.updateExperienceHindsightStatus(createdExp.id, 'SYNCED', memoryId);
      } else {
        syncStatus = 'FAILED';
        syncError = retainResult.error;
        await db.updateExperienceHindsightStatus(createdExp.id, 'FAILED', undefined, syncError);
      }
    } else {
      syncStatus = 'FAILED';
      syncError = 'Hindsight unconfigured on server.';
      await db.updateExperienceHindsightStatus(createdExp.id, 'FAILED', undefined, syncError);
    }

    // Step 3: Record outcome linked to proposal
    const outcome = await db.recordOutcome(
      {
        proposalId: proposal.id,
        actualResult,
        whatHappened,
        didPredictedRiskOccur: Boolean(didPredictedRiskOccur),
        assumptionsCorrect,
        assumptionsWrong,
        whatWorked,
        whatFailed,
        actualRootCause,
        finalLesson,
        futureAdvice,
      },
      createdExp.id,
      memoryId,
      syncStatus,
      syncError
    );

    res.json({
      outcome,
      newProject: createdProject,
      newExperience: createdExp,
      hindsight: retainResult || {
        success: false,
        statusMessage: 'Saved locally, but organizational memory synchronization failed (Hindsight unconfigured).',
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Knowledge Insights & Analytics (Real Data Only) ---
app.get('/api/insights', (req: Request, res: Response) => {
  try {
    const insights = db.getInsights();
    res.json(insights);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Audit Logs ---
app.get('/api/audit-logs', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = db.getAuditLogs(limit);
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Demo Data Controls (Explicit user action only) ---
app.post('/api/demo/load', async (req: Request, res: Response) => {
  try {
    await db.loadDemoData();
    res.json({ success: true, message: 'Demo historical precedents loaded successfully.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/demo/clear', async (req: Request, res: Response) => {
  try {
    await db.clearAllData();
    res.json({ success: true, message: 'Database reset to empty state.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Vite middleware in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Decision Gate server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
