import cors from 'cors';
import express, { Request, Response } from 'express';

import { deepResearch, writeFinalAnswer,writeFinalReport } from './deep-research';
import { analyzeSentiment, createSentimentResearchQuery } from './sentiment-analysis';

const app = express();
const port = process.env.PORT || 3051;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function for consistent logging
function log(...args: any[]) {
  console.log(...args);
}

// API endpoint to run research
app.post('/api/research', async (req: Request, res: Response) => {
  try {
    const { query, depth = 3, breadth = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    log('\nStarting research...\n');

    const { learnings, visitedUrls } = await deepResearch({
      query,
      breadth,
      depth,
    });

    log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
    log(
      `\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`,
    );

    const answer = await writeFinalAnswer({
      prompt: query,
      learnings,
    });

    // Return the results
    return res.json({
      success: true,
      answer,
      learnings,
      visitedUrls,
    });
  } catch (error: unknown) {
    console.error('Error in research API:', error);
    return res.status(500).json({
      error: 'An error occurred during research',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// generate report API
app.post('/api/generate-report',async(req:Request,res:Response)=>{
  try{
    const {query,depth = 3,breadth=3 } = req.body;
    if(!query){
      return res.status(400).json({error:'Query is required'});
    }
    log('\n Starting research...\n')
    const {learnings,visitedUrls} = await deepResearch({
      query,
      breadth,
      depth
    });
    log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
    log(
      `\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`,
    );
    const report = await writeFinalReport({
      prompt:query,
      learnings,
      visitedUrls
    });

    return res.json({
      success: true,
      report,
      learnings,
      visitedUrls
    })
    
  }catch(error:unknown){
    console.error("Error in generate report API:",error)
    return res.status(500).json({
      error:'An error occurred during research',
      message:error instanceof Error? error.message: String(error),
    })
  }
})

// Sentiment Analysis API - performs research focused on sentiment
app.post('/api/sentiment-research', async (req: Request, res: Response) => {
  try {
    const { companyName, domain, depth = 2, breadth = 4 } = req.body;

    if (!companyName || !domain) {
      return res.status(400).json({ error: 'companyName and domain are required' });
    }

    log(`\nStarting sentiment research for ${companyName} (${domain})...\n`);

    // Create sentiment-focused research query
    const query = createSentimentResearchQuery(companyName, domain);

    // Perform deep research
    const { learnings, visitedUrls } = await deepResearch({
      query,
      breadth,
      depth,
    });

    log(`\n\nLearnings (${learnings.length}):\n\n${learnings.join('\n\n')}`);
    log(`\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`);

    // Generate full report
    const report = await writeFinalReport({
      prompt: query,
      learnings,
      visitedUrls,
    });

    log('\n\nGenerating sentiment analysis...\n');

    // Analyze sentiment from learnings and report
    const sentimentAnalysis = await analyzeSentiment({
      companyName,
      domain,
      learnings,
      report,
    });

    log(`\nSentiment: ${sentimentAnalysis.sentiment.overall} (${sentimentAnalysis.sentiment.score.toFixed(2)})`);
    log(`Confidence: ${(sentimentAnalysis.sentiment.confidence * 100).toFixed(1)}%`);

    return res.json({
      success: true,
      companyName,
      domain,
      report,
      learnings,
      visitedUrls,
      sentiment: sentimentAnalysis,
    });
  } catch (error: unknown) {
    console.error('Error in sentiment research API:', error);
    return res.status(500).json({
      error: 'An error occurred during sentiment research',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Sentiment Analysis Only - analyze sentiment from existing learnings/report
app.post('/api/analyze-sentiment', async (req: Request, res: Response) => {
  try {
    const { companyName, domain, learnings, report } = req.body;

    if (!companyName || !domain || !learnings || !report) {
      return res.status(400).json({ 
        error: 'companyName, domain, learnings, and report are required' 
      });
    }

    log(`\nAnalyzing sentiment for ${companyName} (${domain})...\n`);

    const sentimentAnalysis = await analyzeSentiment({
      companyName,
      domain,
      learnings,
      report,
    });

    log(`\nSentiment: ${sentimentAnalysis.sentiment.overall} (${sentimentAnalysis.sentiment.score.toFixed(2)})`);
    log(`Confidence: ${(sentimentAnalysis.sentiment.confidence * 100).toFixed(1)}%`);

    return res.json({
      success: true,
      sentiment: sentimentAnalysis,
    });
  } catch (error: unknown) {
    console.error('Error in sentiment analysis API:', error);
    return res.status(500).json({
      error: 'An error occurred during sentiment analysis',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Deep Research API running on port ${port}`);
});

export default app;
