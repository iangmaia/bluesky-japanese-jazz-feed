import { NextApiRequest, NextApiResponse } from 'next'
import { searchAndBackfill } from '../../scripts/backfillFeed'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify secret token to prevent unauthorized access
  const { authorization } = req.headers
  if (authorization !== `Bearer ${process.env.BACKFILL_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    await searchAndBackfill()
    res.status(200).json({ message: 'Backfill completed successfully' })
  } catch (error) {
    console.error('Backfill error:', error)
    res.status(500).json({ error: 'Failed to run backfill' })
  }
}
