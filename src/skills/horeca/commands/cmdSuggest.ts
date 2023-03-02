import { CommandMiddleware } from "grammy/composer.ts";
import outdent from "outdent";
import { Result } from "../httpClients/fetchNearbyLocations.ts";
import { BotContext } from "/src/context/mod.ts";

function compareLocationRating(a: Result, b: Result) {
  const hasBetterRating = a.rating > b.rating;

  if (hasBetterRating) {
    return -1;
  }

  if (!hasBetterRating) {
    return 1;
  }

  return 0;
}

const locationToMessage = (
  {
    name,
    place_id,
    rating,
    user_ratings_total,
    vicinity: address,
    geometry: { location },
  }: Result,
) => {
  const googleMapsLink =
    `https://www.google.com/maps/place/?q=place_id:${place_id}`;
  const bikeDirections =
    `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=bicycling`;
  const publicTransportationDirections =
    `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=transit`;

  return outdent`
Name: ${name}
Rating: ${rating} (${user_ratings_total})
Address: ${address}
See in Google Maps: ${googleMapsLink}
Directions by Bike: ${bikeDirections}
Directions by Public Transportation: ${publicTransportationDirections}`;
};

export const cmdSuggest: CommandMiddleware<BotContext> = async (ctx) => {
  const keyword = ctx.match;

  if (!keyword) {
    return ctx.reply(
      "Include a keyword after the command. Example: `/suggest craft beers`",
    );
  }

  const repliedMessage = (ctx.msg ?? ctx.update.message).reply_to_message;
  const repliedMessageLocation = repliedMessage?.location;

  if (!repliedMessageLocation) {
    return ctx.reply("Reply to a location message to get suggestions.");
  }

  const { latitude, longitude } = repliedMessageLocation;

  const locations = await ctx.locationsApi.fetchNearbyLocations({
    keyword,
    latitude,
    longitude,
  });

  type GroupedByReviewCount = {
    plusThousandReviews: Result[];
    plusFiveHundredReviews: Result[];
    plusOneHundredReviews: Result[];
  };

  const locationsGroupedByReviewCount = locations.results.reduce(
    (accumulator, current) => {
      if (current.user_ratings_total > 999) {
        return {
          ...accumulator,
          plusThousandReviews: accumulator.plusThousandReviews.concat(current),
        };
      }

      if (current.user_ratings_total > 499) {
        return {
          ...accumulator,
          plusFiveHundredReviews: accumulator.plusFiveHundredReviews.concat(
            current,
          ),
        };
      }

      if (current.user_ratings_total > 99) {
        return {
          ...accumulator,
          plusOneHundredReviews: accumulator.plusOneHundredReviews.concat(
            current,
          ),
        };
      }

      return accumulator;
    },
    {
      plusThousandReviews: [],
      plusFiveHundredReviews: [],
      plusOneHundredReviews: [],
    } as GroupedByReviewCount,
  );

  const sortedLocationGroups: GroupedByReviewCount = {
    plusOneHundredReviews: locationsGroupedByReviewCount.plusOneHundredReviews
      .sort(compareLocationRating),
    plusFiveHundredReviews: locationsGroupedByReviewCount.plusFiveHundredReviews
      .sort(compareLocationRating),
    plusThousandReviews: locationsGroupedByReviewCount.plusThousandReviews.sort(
      compareLocationRating,
    ),
  };

  const bestRated = {
    plusOneHundred: sortedLocationGroups.plusOneHundredReviews[0],
    plusFiveHundred: sortedLocationGroups.plusFiveHundredReviews[0],
    plusThousand: sortedLocationGroups.plusThousandReviews[0],
  };

  const message = outdent`
Best rated with more +1000 reviews:
${
    bestRated.plusThousand
      ? locationToMessage(bestRated.plusThousand)
      : "No place with +1000 reviews."
  }

Best rated with +500 reviews:
${
    bestRated.plusFiveHundred
      ? locationToMessage(bestRated.plusFiveHundred)
      : "No place with +500 reviews."
  } 

Best rated with +100 reviews:
${
    bestRated.plusOneHundred
      ? locationToMessage(bestRated.plusOneHundred)
      : "No place with +100 reviews."
  }
`;

  return ctx.reply(message);
};
