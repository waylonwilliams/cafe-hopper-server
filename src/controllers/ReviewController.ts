import { Request, Response } from 'express';

/**
 * Ping the server to cache cafe info every 5th request, or every requrest when there aren't many requests.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const reviewPing = async (req: Request, res: Response): Promise<void> => {
  const cafeId = req.params.cafeId;
  if (!cafeId) {
    res.status(400).send('No cafe id provided');
    return;
  }

  console.log('Cafe id:', cafeId);
  // fetch cafe info by id
  // check number of reviews and update if needed
  // fetch all reviews
  // count them
  // average them
  // summarize reviews with ai
  // collect top tags

  res.status(200).send('Hello world review ping');
};
