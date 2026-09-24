import { VoiceActivationResult } from './voiceTypes';

/* ==========================================================================
   SOL ACTIVATION DETECTOR
   Detects natural language wake-word utterances containing "SOL".
   Strictly enforces word boundaries to avoid false positives (e.g. "solar",
   "solution", "console", "solenoid", "solid", "solvent").
   ========================================================================== */

export class ActivationDetector {
  /**
   * Word-boundary regex patterns targeting natural activation phrases
   */
  private readonly _wakePatterns: RegExp[] = [
    /\b(hey|okay|ok|hi|hello|can|could|will|would|please)?\s*\bsol\b/i,
  ];

  /**
   * Strict exclusion list of words containing "sol" substring
   */
  private readonly _exclusionWords = [
    'solar',
    'solution',
    'solutions',
    'console',
    'solenoid',
    'solid',
    'solitude',
    'solitary',
    'solvent',
    'absolute',
    'obsolete',
  ];

  /**
   * Analyze raw transcript for valid SOL activation and extract operational command payload.
   */
  public detectActivation(rawTranscript: string): VoiceActivationResult {
    const trimmed = rawTranscript.trim();
    if (!trimmed) {
      return { isActivated: false, rawTranscript };
    }

    const lower = trimmed.toLowerCase();

    // 1. Verify token/word boundary match for "SOL"
    const solWordMatch = /\bsol\b/i.exec(trimmed);
    if (!solWordMatch) {
      return { isActivated: false, rawTranscript };
    }

    // 2. Check exclusion list (ensure no excluded words match)
    const words = lower.split(/\s+/);
    const hasExclusionOnly = words.some((w) =>
      this._exclusionWords.includes(w.replace(/[^a-z]/g, ''))
    ) && !words.includes('sol');

    if (hasExclusionOnly) {
      return { isActivated: false, rawTranscript };
    }

    // 3. Match wake pattern
    let matchedPattern = false;
    let matchedPrefix = '';

    for (const pattern of this._wakePatterns) {
      const match = pattern.exec(trimmed);
      if (match) {
        matchedPattern = true;
        matchedPrefix = match[0];
        break;
      }
    }

    if (!matchedPattern) {
      return { isActivated: false, rawTranscript };
    }

    // 4. Extract command payload following or preceding activation word
    let extractedCommand = trimmed.substring(matchedPrefix.length).trim();

    // Clean leading punctuation or common filler conjunctions (e.g., ", ", "please ", "can you ")
    extractedCommand = extractedCommand.replace(/^[\s,.:;!?\-]+/, '');
    extractedCommand = extractedCommand.replace(/^(please|can you|could you|to|and|i want you to)\s+/i, '');

    // If command preceded the activation word (e.g. "Open Chrome SOL")
    if (!extractedCommand && trimmed.length > matchedPrefix.length) {
      extractedCommand = trimmed.replace(new RegExp(matchedPrefix, 'gi'), '').trim();
    }

    return {
      isActivated: true,
      activationWord: matchedPrefix.trim(),
      extractedCommand: extractedCommand.trim() || trimmed,
      rawTranscript,
    };
  }
}

export const activationDetector = new ActivationDetector();
