"""Conversation history stays on this client and keeps every turn."""

import tempfile
import unittest
from pathlib import Path

from app import store


class StoreTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "history.db"
        store.init_db(self.path)

    def tearDown(self):
        self.directory.cleanup()

    def test_saves_every_turn_and_hides_other_clients(self):
        store.save_turn("client-a", "conversation-1", "试用期不交社保，合法吗？", "杭州", "student", {"title": "试用期", "summary": "要交"}, None, self.path)
        store.save_turn("client-a", "conversation-1", "那如果已经转正了呢", "杭州", "student", None, "本次回答已停止。你可以重新提问。", self.path)
        store.save_turn("client-b", "conversation-2", "别人的问题", "", "unspecified", {"title": "别人"}, None, self.path)
        listed = store.list_conversations("client-a", self.path)
        self.assertEqual([item["id"] for item in listed], ["conversation-1"])
        self.assertEqual(listed[0]["title"], "试用期不交社保，合法吗？")
        self.assertEqual(listed[0]["turns"], 2)
        detail = store.get_conversation("client-a", "conversation-1", self.path)
        self.assertEqual([turn["question"] for turn in detail["turns"]], ["试用期不交社保，合法吗？", "那如果已经转正了呢"])
        self.assertEqual(detail["turns"][0]["answer"]["title"], "试用期")
        self.assertIsNone(detail["turns"][1]["answer"])
        self.assertIsNone(store.get_conversation("client-b", "conversation-1", self.path))
        self.assertFalse(store.save_turn("client-b", "conversation-1", "想写进别人的对话", "", "unspecified", None, None, self.path))


if __name__ == "__main__":
    unittest.main()
