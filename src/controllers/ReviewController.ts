import { Request, Response } from 'express';

/**
 * Ping the server to cache cafe info every 5th request, or every requrest when there aren't many requests.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const reviewPing = async (req: Request, res: Response): Promise<void> => {
  console.log('Hello world review ping');
  res.status(200).send('Hello world review ping');
};
