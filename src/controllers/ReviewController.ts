import { Request, Response } from 'express';
import { serviceClient } from '@/utils/supabase/Client';
import OpenAI from 'openai';

const summarizeReviews = async (reviews: string[]): Promise<string | null> => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // can refine this prompt depending on how we will present it
    const prompt = `Summarize the following reviews of a cafe in 3 sentences. Attempt to highlight the 3 most mentioned aspects of the cafe:\n\n${reviews.join('\n\n')}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in summarizeReviews:', error);
    return null;
  }
};

/**
 * Ping the server to cache cafe info every 5th request, or every requrest when there aren't many requests.
 * http://localhost:3000/cafes/ping [PUT] include cafeId and rating in the body
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const reviewPing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cafeId, rating } = req.body;
    if (!cafeId || !rating) {
      throw `No cafe id or rating provided, include them in the body of your request.
      
      Example: fetch(process.env.EXPO_PUBLIC_SERVER_URL + 'cafes/ping', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cafeId: data.cafe_id,
            rating: rating,
          }),
        })`;
    }

    const supabase = serviceClient();

    // you can see this supabase function defined on supabase
    // increments num reviews and recalculates cafe info
    const { data: newNumReviews, error: cafeError } = await supabase.rpc('inc_num_reviews', {
      cafe_id: cafeId,
      review_rating: rating,
    });
    if (cafeError) throw cafeError;

    // Only run tags, image, and ai summary sometimes
    if (newNumReviews < 10 || newNumReviews % 5 === 0) {
      // fetch reviews
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('cafe_id', cafeId);
      if (reviewError) throw reviewError;

      // calculate average rating
      const numReviews = reviewData.length;
      const avgRating = reviewData.reduce((acc, review) => acc + review.rating, 0) / numReviews;

      // loop through every tag of every review and count them
      const topTagsDict: { [key: string]: number } = {};
      let image: string | null = null;
      for (const review of reviewData) {
        for (const tag of review.tags) {
          if (topTagsDict[tag]) {
            topTagsDict[tag]++;
          } else {
            topTagsDict[tag] = 1;
          }
        }

        // for now just grab an image from the first review with one
        // UPDATE to grab most liked review's image
        if (image === null && review.images.length > 0) {
          image = review.images[0];
        }
      }

      // extract top 7 tags by quantity
      const topTags = Object.keys(topTagsDict)
        .sort((a, b) => topTagsDict[b] - topTagsDict[a])
        .slice(0, 8);

      let summary: string | null = null;
      if (newNumReviews >= 10) {
        summary = await summarizeReviews(reviewData.map((review) => review.description));
      }

      const { error } = await supabase
        .from('cafes')
        .update({
          num_reviews: numReviews,
          rating: avgRating,
          tags: topTags,
          image: image === null ? undefined : image, // only include image if one has been found
          summary: summary === null ? undefined : summary, // only include summary if it has been generated
        })
        .eq('id', cafeId);
      if (error) throw error;
    }

    res.status(200).send('Thanks!');
  } catch (error) {
    console.error('Error in reviewPing:', error);
    res.status(500).send('Internal server error / cafe not found');
  }
};
