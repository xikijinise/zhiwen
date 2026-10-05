"""检索不调用模型，面试时可以直接跑。"""

import unittest

from app.knowledge import CHECKED_AT, citations_for, entries, knowledge_answer, retrieve, sources


class RetrieveTest(unittest.TestCase):
    def test_trial_insurance_ranks_the_employment_rule_first(self):
        ids = [item["id"] for item in retrieve("试用期不交社保，合法吗？")]
        self.assertEqual(ids[0], "insurance-trial")
        self.assertIn("intern-insurance", ids)

    def test_unrelated_question_returns_nothing(self):
        self.assertEqual(retrieve("今天天气怎么样"), [])

    def test_followup_without_topic_words_uses_the_previous_question(self):
        history = [{"question": "试用期不交社保，合法吗？", "summary": "试用期也要参保"}]
        ids = [item["id"] for item in retrieve("那如果已经转正了呢", history)]
        self.assertEqual(ids[0], "insurance-trial")

    def test_added_sources_rank_ahead_of_nearby_entries(self):
        cases = {
            "没签合同怎么认定劳动关系？": "relation-test",
            "试用期工资最少发多少？": "probation-pay",
            "试用期最长可以多久？": "probation-length",
            "应届生有年假吗？": "annual-leave",
            "怀孕期间公司能辞退吗？": "pregnancy",
            "实习受伤算工伤吗？": "injury",
            "上班受伤算工伤吗？": "injury",
            "劳务派遣和正式工有什么区别？": "dispatch",
            "工资几号发、必须给工资条吗？": "wage-payday",
            "公司拖欠工资，我该怎么办？": "unpaid",
            "实习生受劳动法保护吗？": "intern-relation",
        }
        for question, expected in cases.items():
            ids = [item["id"] for item in retrieve(question)]
            self.assertTrue(ids, question)
            self.assertEqual(ids[0], expected, question)

    def test_new_entries_only_cite_known_sources(self):
        self.assertEqual(len(entries), 26)
        self.assertEqual(len(sources), 17)
        self.assertEqual(CHECKED_AT, "2026-10-05")
        known = {item["id"] for item in sources}
        by_id = {item["id"]: item for item in entries}
        self.assertIn("10", {item["id"] for item in citations_for(by_id["contract-missing"])})
        self.assertIn("11", {item["id"] for item in citations_for(by_id["intern-relation"])})
        for entry in entries:
            cited = citations_for(entry)
            self.assertTrue(cited, entry["id"])
            self.assertTrue(all(item["id"] in known for item in cited), entry["id"])

    def test_miss_becomes_a_knowledge_answer_without_sources(self):
        answer = knowledge_answer("今天天气怎么样", "")
        self.assertEqual(answer["mode"], "knowledge")
        self.assertEqual(answer["sources"], [])
        self.assertNotIn("notice", answer)


if __name__ == "__main__":
    unittest.main()
