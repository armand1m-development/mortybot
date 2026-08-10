import { assertEquals } from "@std/assert";
import { createTranslator } from "/src/i18n/mod.ts";
import { createFilterActionAudit } from "./createFilterActionAudit.ts";

const user = {
  id: 123,
  is_bot: false,
  first_name: "Morty",
  username: "morty",
};

Deno.test("formats a deletion audit with the sender and filter trigger", () => {
  assertEquals(
    createFilterActionAudit({
      action: "deleted",
      filterTrigger: "!evidence",
      translate: createTranslator("pt"),
      user,
    }),
    "Só pra deixar registrado: [@morty](tg://user?id=123) foi quem deletou o filtro `!evidence`. Não adianta apagar a evidência depois. Toma vergonha!",
  );
});

Deno.test("formats a deactivation audit with the sender and filter trigger", () => {
  assertEquals(
    createFilterActionAudit({
      action: "deactivated",
      filterTrigger: "!evidence",
      translate: createTranslator("pt"),
      user,
    }),
    "Só pra deixar registrado: [@morty](tg://user?id=123) foi quem desativou o filtro `!evidence`. Não adianta apagar a evidência depois. Toma vergonha!",
  );
});

Deno.test("formats the same audit in English", () => {
  assertEquals(
    createFilterActionAudit({
      action: "deleted",
      filterTrigger: "!evidence",
      translate: createTranslator("en"),
      user,
    }),
    "Just for the record: [@morty](tg://user?id=123) deleted the filter `!evidence`. There is no point deleting the evidence later. Have some shame!",
  );
});
