import type { CommandMiddleware } from "grammy";
import type { Result } from "../httpClients/fetchNearbyLocations.ts";
import type { BotContext } from "/src/context/mod.ts";
import type { Translate } from "/src/i18n/mod.ts";

export const cmdSuggest: CommandMiddleware<BotContext> = async (ctx) => {
  const keyword = ctx.match;
  const repliedMessage = (ctx.msg ?? ctx.update.message).reply_to_message;
  const repliedMessageLocation = repliedMessage?.location!;

  await ctx.api.sendChatAction(ctx.chat.id, "typing");

  const { latitude, longitude } = repliedMessageLocation;

  const locations = await ctx.locationsApi.fetchNearbyLocations({
    keyword,
    latitude,
    longitude,
  });

  const bestRated = getBestRated(locations.results);

  const createSection = (location: Result | undefined, threshold: string) =>
    ctx.t("horeca.section", {
      location: location
        ? locationToMessage(location, ctx.t)
        : ctx.t("horeca.noPlace", { threshold }),
      threshold,
    });

  const message = [
    createSection(bestRated.plusThousand, "+1000"),
    createSection(bestRated.plusFiveHundred, "+500"),
    createSection(bestRated.plusOneHundred, "+100"),
  ].join("\n\n");

  return ctx.reply(message, {
    parse_mode: "Markdown",
  });
};

const getBestRated = (locations: Result[]) => {
  type GroupedByReviewCount = {
    plusThousandReviews: Result[];
    plusFiveHundredReviews: Result[];
    plusOneHundredReviews: Result[];
  };

  const locationsGroupedByReviewCount = locations.reduce(
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
      .sort(compareUsingWeightedAverage),
    plusFiveHundredReviews: locationsGroupedByReviewCount.plusFiveHundredReviews
      .sort(compareUsingWeightedAverage),
    plusThousandReviews: locationsGroupedByReviewCount.plusThousandReviews.sort(
      compareUsingWeightedAverage,
    ),
  };

  const bestRated = {
    plusOneHundred: sortedLocationGroups.plusOneHundredReviews[0],
    plusFiveHundred: sortedLocationGroups.plusFiveHundredReviews[0],
    plusThousand: sortedLocationGroups.plusThousandReviews[0],
  };

  return bestRated;
};

function _compareLocationRating(a: Result, b: Result) {
  const hasBetterRating = a.rating > b.rating;

  if (hasBetterRating) {
    return -1;
  }

  if (!hasBetterRating) {
    return 1;
  }

  return 0;
}

function compareUsingWeightedAverage(a: Result, b: Result) {
  const k = 0.1; // adjust as needed
  const scoreA = a.rating - k * Math.log(a.user_ratings_total);
  const scoreB = b.rating - k * Math.log(b.user_ratings_total);
  return scoreB - scoreA;
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
  translate: Translate,
) => {
  const googleMapsLink =
    `https://www.google.com/maps/place/?q=place_id:${place_id}`;
  const bikeDirections =
    `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=bicycling`;
  const publicTransportationDirections =
    `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=transit`;

  return translate("horeca.location", {
    address,
    bikeUrl: bikeDirections,
    mapsUrl: googleMapsLink,
    name,
    rating,
    reviewCount: user_ratings_total,
    transitUrl: publicTransportationDirections,
  });
};
