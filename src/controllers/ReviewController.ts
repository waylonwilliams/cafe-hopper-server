import { Request, Response } from 'express';
import { serviceClient } from '@/utils/supabase/Client';

/**
 * Ping the server to cache cafe info every 5th request, or every requrest when there aren't many requests.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const reviewPing = async (req: Request, res: Response): Promise<void> => {
  try {
    const cafeId = req.params.cafeId;
    if (!cafeId) {
      throw "No cafe id provided, do so like 'http://localhost:3000/ping/<cafeId>'";
    }

    const supabase = serviceClient();

    // you can see this supabase function defined there
    // essentially increments the number of reviews for a cafe
    const { data: newNumReviews, error: cafeError } = await supabase.rpc('inc_num_reviews', {
      cafe_id: cafeId,
    });
    if (cafeError) throw cafeError;

    // only update this stuff sometimes
    if (newNumReviews < 10 || newNumReviews % 5 === 0) {
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('cafe_id', cafeId);
      if (reviewError) throw reviewError;

      // num reviews, avg rating, top tags, summary, top image(waiting for review likes)

      const numReviews = reviewData.length;
      const avgRating = reviewData.reduce((acc, review) => acc + review.rating, 0) / numReviews;

      // loop through every tag of every review and count them
      const topTagsDict: { [key: string]: number } = {};
      for (const review of reviewData) {
        for (const tag of review.tags) {
          if (topTagsDict[tag]) {
            topTagsDict[tag]++;
          } else {
            topTagsDict[tag] = 1;
          }
        }
      }

      // extract top 7 tags by quantity
      const topTags = Object.keys(topTagsDict)
        .sort((a, b) => topTagsDict[b] - topTagsDict[a])
        .slice(0, 8);

      let summary: string | null = null;
      if (newNumReviews > 10) {
        // do ai summary
      }

      console.log(numReviews, avgRating, topTags, summary);

      const { data: cafeData, error: cafeError } = await supabase
        .from('cafes')
        .update({
          num_reviews: numReviews,
          rating: avgRating,
          tags: topTags,
          summary,
        })
        .eq('id', cafeId);
      if (cafeError) throw cafeError;
    }

    res.status(200).send('Thanks!');
  } catch (error) {
    console.error('Error in reviewPing:', error);
    res.status(500).send('Internal server error / cafe not found');
  }
};
