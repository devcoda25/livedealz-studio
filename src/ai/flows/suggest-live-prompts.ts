// src/ai/flows/suggest-live-prompts.ts
'use server';
/**
 * @fileOverview A flow that suggests live prompts for streamers to enhance viewer engagement.
 *
 * - suggestLivePrompts - A function that generates prompt suggestions.
 * - SuggestLivePromptsInput - The input type for the suggestLivePrompts function.
 * - SuggestLivePromptsOutput - The return type for the suggestLivePrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLivePromptsInputSchema = z.object({
  chatHistory: z
    .string()
    .describe('The recent chat history from the live stream.'),
  currentTopic: z.string().describe('The current topic of the live stream.'),
  viewerSentiment: z
    .string()
    .describe('The overall sentiment of the viewers in the chat.'),
});

export type SuggestLivePromptsInput = z.infer<typeof SuggestLivePromptsInputSchema>;

const SuggestLivePromptsOutputSchema = z.object({
  promptSuggestions: z
    .array(z.string())
    .describe('An array of AI-generated prompt suggestions for the streamer.'),
});

export type SuggestLivePromptsOutput = z.infer<typeof SuggestLivePromptsOutputSchema>;

export async function suggestLivePrompts(input: SuggestLivePromptsInput): Promise<SuggestLivePromptsOutput> {
  return suggestLivePromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLivePromptsPrompt',
  input: {schema: SuggestLivePromptsInputSchema},
  output: {schema: SuggestLivePromptsOutputSchema},
  prompt: `You are an AI assistant providing prompt suggestions to a live streamer to enhance viewer engagement.

  Given the following context, generate three distinct prompt suggestions that the streamer can use to interact with their audience:

  Current Topic: {{{currentTopic}}}
  Chat History: {{{chatHistory}}}
  Viewer Sentiment: {{{viewerSentiment}}}

  The prompt suggestions should be engaging, relevant to the current topic, and address the overall viewer sentiment.

  Format the output as a JSON object with a "promptSuggestions" field containing an array of strings.
  `, 
});

const suggestLivePromptsFlow = ai.defineFlow(
  {
    name: 'suggestLivePromptsFlow',
    inputSchema: SuggestLivePromptsInputSchema,
    outputSchema: SuggestLivePromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
