// Placeholder for openai-service compatibility
export const openaiService = {
  generateTasks: async () => [],
  analyzeTaskCompletion: async (task: any, actualMinutes: number, notes?: string) => ({
    feedback: `Completed task "${task?.title || 'Unknown'}" in ${actualMinutes} minutes. ${notes ? 'Notes: ' + notes : ''}`,
    nextSuggestions: ['Continue with similar focused work', 'Take a short break'],
    focusInsights: 'Good focus session completed',
    bonusXP: Math.max(5, Math.min(25, actualMinutes)),
    focusScore: 8
  })
};