// THIS FILE IS AUTO-GENERATED FROM translations.yaml
// RUN `deno task generate:i18n` TO UPDATE IT
export const supportedLanguages = ["en","pt"] as const;
export type Language = typeof supportedLanguages[number];

export const translationKeys = [
  "assistant.contextCleared",
  "assistant.emojis.changed",
  "assistant.emojis.current",
  "assistant.emojis.unsupported",
  "assistant.error",
  "assistant.filesReady",
  "assistant.language.changed",
  "assistant.language.current",
  "assistant.language.name.auto",
  "assistant.language.unsupported",
  "assistant.looking",
  "assistant.mediaNotDelivered",
  "assistant.preferences.chatEntry",
  "assistant.preferences.duplicate",
  "assistant.preferences.empty",
  "assistant.preferences.forbidden",
  "assistant.preferences.forgetUsage",
  "assistant.preferences.forgotten",
  "assistant.preferences.heading",
  "assistant.preferences.limit",
  "assistant.preferences.notFound",
  "assistant.preferences.stored",
  "assistant.preferences.tooLong",
  "assistant.preferences.usage",
  "assistant.preferences.userEntry",
  "assistant.sources",
  "assistant.tool.cancel",
  "assistant.tool.cancelled",
  "assistant.tool.completed",
  "assistant.tool.confirm",
  "assistant.tool.expired",
  "assistant.tool.failed",
  "assistant.tool.notAllowed",
  "assistant.tool.running",
  "assistant.tool.wrongUser",
  "assistant.working",
  "chat.aliasNotImplemented",
  "chat.noImage",
  "chat.report.authorUnknown",
  "chat.report.reported",
  "chat.report.reporterUnknown",
  "common.locationReplyRequired",
  "common.replyRequired",
  "common.textRequired",
  "currency.error",
  "currency.result",
  "currency.usage",
  "filters.actionAudit.deactivated",
  "filters.actionAudit.deleted",
  "filters.activated",
  "filters.added",
  "filters.caseSensitivity",
  "filters.missingArgument.activate",
  "filters.missingArgument.add",
  "filters.missingArgument.delete",
  "filters.missingArgument.stop",
  "filters.none",
  "filters.notFound",
  "filters.ownerCount.entry",
  "filters.ownerCount.heading",
  "filters.ownerCount.unknownOwner",
  "filters.ownerList.entry",
  "filters.ownerList.unknownOwner",
  "filters.search.missingArgument",
  "filters.search.noMatches",
  "galileo.duration",
  "galileo.noPasses",
  "galileo.pass",
  "galileo.positionRequired",
  "galileo.replyMustBeLocation",
  "goodbye.entry",
  "goodbye.farewell",
  "goodbye.heading",
  "goodbye.none",
  "goodbye.unknownUserEntry",
  "hashtags.alreadyJoined",
  "hashtags.joinUsage",
  "hashtags.joined",
  "hashtags.leaveUsage",
  "hashtags.left",
  "hashtags.listEntry",
  "hashtags.none",
  "horeca.location",
  "horeca.noPlace",
  "horeca.section",
  "image.debugMode",
  "image.invalidJson",
  "image.invalidMemeInput",
  "image.invalidTemplate",
  "image.invalidTemplateJson",
  "image.noTemplates",
  "image.templateCreated",
  "image.templateNotFound",
  "language.changed",
  "language.current",
  "language.name.en",
  "language.name.pt",
  "language.unsupported",
  "math.exchangeRatesUnavailable",
  "math.invalidExpression",
  "math.rateLimited",
  "taxIncome.incomeRequired",
  "taxIncome.report",
  "terceiraPonte.error",
  "terceiraPonte.loading",
  "weather.forecastEntry",
  "weather.forecastError",
  "weather.forecastHeading",
  "weather.temperature",
  "weather.temperatureError"
] as const;
export type TranslationKey = typeof translationKeys[number];

export interface TranslationValues {
  "assistant.contextCleared": Record<never, never>;
  "assistant.emojis.changed": { "enabled": string };
  "assistant.emojis.current": { "enabled": string };
  "assistant.emojis.unsupported": Record<never, never>;
  "assistant.error": Record<never, never>;
  "assistant.filesReady": { "count": number };
  "assistant.language.changed": { "language": string | number | Date };
  "assistant.language.current": { "language": string | number | Date };
  "assistant.language.name.auto": Record<never, never>;
  "assistant.language.unsupported": Record<never, never>;
  "assistant.looking": Record<never, never>;
  "assistant.mediaNotDelivered": Record<never, never>;
  "assistant.preferences.chatEntry": { "author": string | number | Date; "id": string | number | Date; "text": string | number | Date };
  "assistant.preferences.duplicate": { "id": string | number | Date };
  "assistant.preferences.empty": Record<never, never>;
  "assistant.preferences.forbidden": { "id": string | number | Date };
  "assistant.preferences.forgetUsage": Record<never, never>;
  "assistant.preferences.forgotten": { "id": string | number | Date };
  "assistant.preferences.heading": Record<never, never>;
  "assistant.preferences.limit": { "count": string | number | Date };
  "assistant.preferences.notFound": { "id": string | number | Date };
  "assistant.preferences.stored": { "id": string | number | Date; "text": string | number | Date };
  "assistant.preferences.tooLong": { "count": string | number | Date };
  "assistant.preferences.usage": Record<never, never>;
  "assistant.preferences.userEntry": { "author": string | number | Date; "id": string | number | Date; "text": string | number | Date };
  "assistant.sources": Record<never, never>;
  "assistant.tool.cancel": Record<never, never>;
  "assistant.tool.cancelled": Record<never, never>;
  "assistant.tool.completed": { "command": string | number | Date };
  "assistant.tool.confirm": Record<never, never>;
  "assistant.tool.expired": Record<never, never>;
  "assistant.tool.failed": Record<never, never>;
  "assistant.tool.notAllowed": Record<never, never>;
  "assistant.tool.running": Record<never, never>;
  "assistant.tool.wrongUser": Record<never, never>;
  "assistant.working": { "activity": string | number | Date; "seconds": string | number | Date };
  "chat.aliasNotImplemented": Record<never, never>;
  "chat.noImage": Record<never, never>;
  "chat.report.authorUnknown": Record<never, never>;
  "chat.report.reported": { "user": string | number | Date; "userId": string | number | Date };
  "chat.report.reporterUnknown": Record<never, never>;
  "common.locationReplyRequired": { "command": string | number | Date };
  "common.replyRequired": { "command": string | number | Date };
  "common.textRequired": { "command": string | number | Date };
  "currency.error": Record<never, never>;
  "currency.result": { "amount": string | number | Date; "currency": string | number | Date; "value": string | number | Date };
  "currency.usage": Record<never, never>;
  "filters.actionAudit.deactivated": { "filter": string | number | Date; "user": string | number | Date };
  "filters.actionAudit.deleted": { "filter": string | number | Date; "user": string | number | Date };
  "filters.activated": Record<never, never>;
  "filters.added": Record<never, never>;
  "filters.caseSensitivity": { "enabled": string };
  "filters.missingArgument.activate": Record<never, never>;
  "filters.missingArgument.add": Record<never, never>;
  "filters.missingArgument.delete": Record<never, never>;
  "filters.missingArgument.stop": Record<never, never>;
  "filters.none": Record<never, never>;
  "filters.notFound": { "filter": string | number | Date };
  "filters.ownerCount.entry": { "count": number; "owner": string | number | Date };
  "filters.ownerCount.heading": { "entries": string | number | Date };
  "filters.ownerCount.unknownOwner": { "count": number; "ownerId": string | number | Date };
  "filters.ownerList.entry": { "active": string; "filter": string | number | Date; "owner": string | number | Date };
  "filters.ownerList.unknownOwner": { "filter": string | number | Date; "ownerId": string | number | Date };
  "filters.search.missingArgument": Record<never, never>;
  "filters.search.noMatches": { "query": string | number | Date };
  "galileo.duration": { "minutes": number | string | number | Date; "seconds": string | number | Date };
  "galileo.noPasses": { "latitude": string | number | Date; "longitude": string | number | Date };
  "galileo.pass": { "date": string | number | Date; "duration": string | number | Date; "endAzimuth": string | number | Date; "endCompass": string | number | Date; "endElevation": string | number | Date; "endTime": string | number | Date; "magnitude": string | number | Date; "magnitudeBar": string | number | Date; "maxAzimuth": string | number | Date; "maxCompass": string | number | Date; "maxElevation": string | number | Date; "maxTime": string | number | Date; "startAzimuth": string | number | Date; "startCompass": string | number | Date; "startElevation": string | number | Date; "startTime": string | number | Date };
  "galileo.positionRequired": Record<never, never>;
  "galileo.replyMustBeLocation": Record<never, never>;
  "goodbye.entry": { "count": number; "rank": string | number | Date; "user": string | number | Date; "winner": string };
  "goodbye.farewell": Record<never, never>;
  "goodbye.heading": { "entries": string | number | Date };
  "goodbye.none": Record<never, never>;
  "goodbye.unknownUserEntry": { "count": number; "rank": string | number | Date; "userId": string | number | Date; "winner": string };
  "hashtags.alreadyJoined": { "hashtag": string | number | Date };
  "hashtags.joinUsage": Record<never, never>;
  "hashtags.joined": { "hashtag": string | number | Date };
  "hashtags.leaveUsage": Record<never, never>;
  "hashtags.left": { "hashtag": string | number | Date };
  "hashtags.listEntry": { "count": number; "hashtag": string | number | Date };
  "hashtags.none": Record<never, never>;
  "horeca.location": { "address": string | number | Date; "bikeUrl": string | number | Date; "mapsUrl": string | number | Date; "name": string | number | Date; "rating": string | number | Date; "reviewCount": string | number | Date; "transitUrl": string | number | Date };
  "horeca.noPlace": { "threshold": string | number | Date };
  "horeca.section": { "location": string | number | Date; "threshold": string | number | Date };
  "image.debugMode": { "enabled": string };
  "image.invalidJson": Record<never, never>;
  "image.invalidMemeInput": Record<never, never>;
  "image.invalidTemplate": { "templates": string | number | Date };
  "image.invalidTemplateJson": Record<never, never>;
  "image.noTemplates": Record<never, never>;
  "image.templateCreated": Record<never, never>;
  "image.templateNotFound": Record<never, never>;
  "language.changed": { "language": string | number | Date };
  "language.current": { "language": string | number | Date };
  "language.name.en": Record<never, never>;
  "language.name.pt": Record<never, never>;
  "language.unsupported": Record<never, never>;
  "math.exchangeRatesUnavailable": Record<never, never>;
  "math.invalidExpression": Record<never, never>;
  "math.rateLimited": Record<never, never>;
  "taxIncome.incomeRequired": Record<never, never>;
  "taxIncome.report": { "grossHour": string | number | Date; "grossYear": string | number | Date; "incomeTax": string | number | Date; "labourCredit": string | number | Date; "netMonth": string | number | Date; "netYear": string | number | Date; "payrollTax": string | number | Date; "socialTax": string | number | Date; "taxableYear": string | number | Date; "taxCredit": string | number | Date; "taxFreeYear": string | number | Date };
  "terceiraPonte.error": Record<never, never>;
  "terceiraPonte.loading": Record<never, never>;
  "weather.forecastEntry": { "description": string | number | Date; "time": string | number | Date };
  "weather.forecastError": Record<never, never>;
  "weather.forecastHeading": { "query": string | number | Date };
  "weather.temperature": { "feelsLike": string | number | Date; "query": string | number | Date; "temperature": string | number | Date };
  "weather.temperatureError": Record<never, never>;
}

export type Translate = <Key extends TranslationKey>(
  key: Key,
  ...values: keyof TranslationValues[Key] extends never
    ? [values?: undefined]
    : [values: TranslationValues[Key]]
) => string;
