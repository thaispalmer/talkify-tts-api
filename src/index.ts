import axios, { AxiosError, AxiosResponse, AxiosInstance } from 'axios';
import { Readable } from 'stream';

export interface TalkifyOptions {
  key: string | undefined;
  format?: 'mp3' | 'wav';
  fallbackLanguage?: string;
  voice?: string;
  rate?: number;
  ssml?: boolean;
  whisper?: boolean;
  soft?: boolean;
  volume?: number;
  wordBreak?: number;
  pitch?: number;
}

export type SpeechOptions = Omit<TalkifyOptions, 'key'>;

export type SpeechStream = AxiosResponse<Readable>['data'];

export type Voice = {
  culture: string;
  name: string;
  description: string;
  isStandard: boolean;
  isPremium: boolean;
  isExclusive: boolean;
  isNeural: boolean;
  canUseSpeechMarks: boolean;
  canWhisper: boolean;
  canUseWordBreak: boolean;
  canSpeakSoftly: boolean;
  canUseVolume: boolean;
  canUsePitch: boolean;
  supportsSpeechMarks: boolean;
  gender: 'Male' | 'Female';
  standardVoice: boolean;
  supportedFormats: string[];
  language: string;
}

type VoiceResponse = {
  Culture: string;
  Name: string;
  Description: string;
  IsStandard: boolean;
  IsPremium: boolean;
  IsExclusive: boolean;
  IsNeural: boolean;
  CanUseSpeechMarks: boolean;
  CanWhisper: boolean;
  CanUseWordBreak: boolean;
  CanSpeakSoftly: boolean;
  CanUseVolume: boolean;
  CanUsePitch: boolean;
  SupportsSpeechMarks: boolean;
  Gender: 'Male' | 'Female';
  StandardVoice: boolean;
  SupportedFormats: string[];
  Language: string;
}

export class TalkifyError extends Error {
  public statusCode?: number;

  constructor(err: Error, name?: string, message?: string, statusCode?: number) {
    super(message);
    this.name = name ?? err.name;
    this.message = message ?? err.message;
    this.stack = err.stack;
    this.statusCode = statusCode;
  }
}

export class Talkify {
  private defaultOptions: TalkifyOptions;
  private connector: AxiosInstance;

  constructor(options: TalkifyOptions) {
    if (!options?.key) {
      throw new TalkifyError(
        new Error('Talkify API-key not given. Visit https://manage.talkify.net to create your own API-key.'),
        "KEY_MISSING"
      );
    }

    this.validateOptions(options);

    this.defaultOptions = {
      ...options,
      key: options.key,
      format: options.format ?? 'mp3',
      ssml: options.ssml ?? true
    };

    this.connector = axios.create({
      baseURL: 'https://talkify.net/api/',
      headers: { 'x-api-key': options.key }
    });
  }

  private validateOptions(options?: Partial<TalkifyOptions>) {
    if (options?.volume && (options.volume < -10 || options.volume > 10)) {
      throw new Error('Invalid range for \'volume\' property. Min: -10, Max: 10.');
    }
    if (options?.pitch && (options.pitch < -10 || options.pitch > 10)) {
      throw new Error('Invalid range for \'pitch\' property. Min: -10, Max: 10.');
    }
    if (options?.wordBreak && (options.wordBreak < 0 || options.wordBreak > 1000)) {
      throw new Error('Invalid range for \'wordBreak\' property. Min: 0, Max: 1000.');
    }
  }

  public async speech(text: string, options?: SpeechOptions):Promise<SpeechStream> {
    this.validateOptions(options);
    try {
      const response = await this.connector.post<Readable>(
        'speech/v1',
        {
          Text: text,
          Format: options?.format ?? this.defaultOptions.format,
          FallbackLanguage: options?.fallbackLanguage ?? this.defaultOptions.fallbackLanguage,
          Voice: options?.voice ?? this.defaultOptions.voice,
          Rate: options?.rate ?? this.defaultOptions.rate,
          TextType: !(options?.ssml ?? this.defaultOptions.ssml) ? 0 : 1,
          Whisper: options?.whisper ?? this.defaultOptions.whisper,
          Soft: options?.soft ?? this.defaultOptions.soft,
          Volume: options?.volume ?? this.defaultOptions.volume,
          WordBreakMs: options?.wordBreak ?? this.defaultOptions.wordBreak,
          Pitch: options?.pitch ?? this.defaultOptions.pitch
        },
        { responseType: 'stream' }
      );
      return response.data;
    } catch (_err) {
      const err = <AxiosError>_err;
      throw new TalkifyError(
        err,
        "REQUEST_ERROR",
        err.response?.statusText ?? 'Could not synthetize the audio',
        err.response?.status
      );
    }
  }

  public async availableVoices(language?: string):Promise<Voice[]> {
    try {
      const response = await this.connector.get(
        'speech/v1/voices',
        { params: { key: this.defaultOptions.key } }
      );

      // Sanitize response
      const voices: Voice[] = [];
      response.data.forEach((rawVoice: VoiceResponse) => {
        if (language && rawVoice.Language.toLowerCase() != language.toLowerCase()) return;
        voices.push({
          culture: rawVoice.Culture,
          name: rawVoice.Name,
          description: rawVoice.Description,
          isStandard: rawVoice.IsStandard,
          isPremium: rawVoice.IsPremium,
          isExclusive: rawVoice.IsExclusive,
          isNeural: rawVoice.IsNeural,
          canUseSpeechMarks: rawVoice.CanUseSpeechMarks,
          canWhisper: rawVoice.CanWhisper,
          canUseWordBreak: rawVoice.CanUseWordBreak,
          canSpeakSoftly: rawVoice.CanSpeakSoftly,
          canUseVolume: rawVoice.CanUseVolume,
          canUsePitch: rawVoice.CanUsePitch,
          supportsSpeechMarks: rawVoice.SupportsSpeechMarks,
          gender: rawVoice.Gender,
          standardVoice: rawVoice.StandardVoice,
          supportedFormats: rawVoice.SupportedFormats,
          language: rawVoice.Language
        });
      });

      return voices;
    } catch (_err) {
      const err = <AxiosError>_err;
      throw new TalkifyError(
        err,
        "REQUEST_ERROR",
        err.response?.statusText ?? 'Could not fetch the voices list',
        err.response?.status
      );
    }
  }
}

export default Talkify;
