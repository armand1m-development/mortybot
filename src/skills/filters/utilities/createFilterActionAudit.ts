import type { User } from "grammy/types";
import type { Translate, TranslationKey } from "/src/i18n/mod.ts";
import { createMemberMention } from "/src/utilities/createMemberMention.ts";
import { markdown } from "/src/utilities/formatMarkdown.ts";

export type FilterAuditAction = "deleted" | "deactivated";

const actionTranslationKeys = {
  deleted: "filters.actionAudit.deleted",
  deactivated: "filters.actionAudit.deactivated",
} as const satisfies Record<FilterAuditAction, TranslationKey>;

export const createFilterActionAudit = ({
  action,
  filterTrigger,
  translate,
  user,
}: {
  action: FilterAuditAction;
  filterTrigger: string;
  translate: Translate;
  user: User;
}) => {
  const mention = createMemberMention(user);
  const formattedTrigger = markdown.monospace(filterTrigger);

  return translate(actionTranslationKeys[action], {
    filter: formattedTrigger,
    user: mention,
  });
};
