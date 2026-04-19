import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axiosConfig";

export const sendChatMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ message, history }, { rejectWithValue }) => {
    try {
      const response = await api.post("/chat", { message, history });
      return {
        userMessage: message,
        agentResponse: response.data.response,
        toolUsed: response.data.tool_used,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Chat failed. Please try again.");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [
      {
        role: "assistant",
        content:
          "👋 Hello! I'm your AI CRM assistant. I can help you:\n\n• **Log interactions** — \"Met Dr. Sharma, discussed oncology drug, very interested\"\n• **Edit records** — \"Change doctor name in record 5 to Dr. Mehta\"\n• **Retrieve logs** — \"Show me all interactions with Dr. Patel\"\n• **Delete records** — \"Delete interaction ID 3\"\n• **Suggest next steps** — \"What should I do next with Dr. Rao?\"\n\nWhat would you like to do?",
        toolUsed: null,
        timestamp: new Date().toISOString(),
      },
    ],
    loading: false,
    error: null,
  },
  reducers: {
    clearChat(state) {
      state.messages = [
        {
          role: "assistant",
          content: "Chat cleared. How can I help you manage your HCP interactions?",
          toolUsed: null,
          timestamp: new Date().toISOString(),
        },
      ];
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Add user message immediately
        state.messages.push({
          role: "user",
          content: action.meta.arg.message,
          toolUsed: null,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({
          role: "assistant",
          content: action.payload.agentResponse,
          toolUsed: action.payload.toolUsed,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.messages.push({
          role: "assistant",
          content: `❌ Error: ${action.payload}`,
          toolUsed: null,
          timestamp: new Date().toISOString(),
          isError: true,
        });
      });
  },
});

export const { clearChat, clearError } = chatSlice.actions;
export default chatSlice.reducer;
