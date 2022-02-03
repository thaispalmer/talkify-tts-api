import axios, { AxiosError, AxiosResponse, AxiosInstance } from 'axios';
import { Readable } from 'stream';
import TalkifyError from './talkifyError';

export interface TalkifyOptions {
  key: string | undefined;
  format?: 'mp3' | 'wav';
  fallbackLanguage?: string;
  voice?: Voice | string;
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
  gender: 'Male' | 'Female';
  language: string;
  supportedFormats: string[];
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
};

export type VoiceResponse = {
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
};

export type Language = {
  name: string;
  cultures: string[];
};

type DetectLanguageResponse = {
  SpecialCharacters: string[];
  Language: number;
  Cultures: string[];
  LanguageName: string;
};

export class Talkify {
  private defaultOptions: TalkifyOptions;
  private connector: AxiosInstance;

  constructor(options: TalkifyOptions) {
    if (!options?.key) {
      throw new TalkifyError(
        new Error('Talkify API-key not given. Visit https://manage.talkify.net to create your own API-key.'),
        'KEY_MISSING',
      );
    }

    this.validateOptions(options);

    this.defaultOptions = {
      ...options,
      key: options.key,
      format: options.format ?? 'mp3',
      ssml: options.ssml ?? true,
    };

    this.connector = axios.create({
      baseURL: 'https://talkify.net/api/',
      headers: { 'x-api-key': options.key },
    });
  }

  private validateOptions(options?: Partial<TalkifyOptions>) {
    const validFormats = ['mp3', 'wav'];
    if (options?.format && !validFormats.includes(options.format)) {
      throw new TalkifyError(
        new Error(`Invalid value for \'format\' property. Available values: ${validFormats.join(',')}`),
        'VALIDATION_ERROR',
      );
    }
    if (options?.volume && (options.volume < -10 || options.volume > 10)) {
      throw new TalkifyError(new Error("Invalid range for 'volume' property. Min: -10, Max: 10."), 'VALIDATION_ERROR');
    }
    if (options?.pitch && (options.pitch < -10 || options.pitch > 10)) {
      throw new TalkifyError(new Error("Invalid range for 'pitch' property. Min: -10, Max: 10."), 'VALIDATION_ERROR');
    }
    if (options?.wordBreak && (options.wordBreak < 0 || options.wordBreak > 1000)) {
      throw new TalkifyError(
        new Error("Invalid range for 'wordBreak' property. Min: 0, Max: 1000."),
        'VALIDATION_ERROR',
      );
    }
  }

  public async speech(text: string, options?: SpeechOptions): Promise<SpeechStream> {
    this.validateOptions(options);
    try {
      let selectedVoice = options?.voice ?? this.defaultOptions.voice;
      if (typeof selectedVoice !== 'string') {
        selectedVoice = selectedVoice?.name;
      }
      const response = await this.connector.post<Readable>(
        'speech/v1',
        {
          Text: text,
          Format: options?.format ?? this.defaultOptions.format,
          FallbackLanguage: options?.fallbackLanguage ?? this.defaultOptions.fallbackLanguage,
          Voice: selectedVoice,
          Rate: options?.rate ?? this.defaultOptions.rate,
          TextType: !(options?.ssml ?? this.defaultOptions.ssml) ? 0 : 1,
          Whisper: options?.whisper ?? this.defaultOptions.whisper,
          Soft: options?.soft ?? this.defaultOptions.soft,
          Volume: options?.volume ?? this.defaultOptions.volume,
          WordBreakMs: options?.wordBreak ?? this.defaultOptions.wordBreak,
          Pitch: options?.pitch ?? this.defaultOptions.pitch,
        },
        { responseType: 'stream' },
      );
      return response.data;
    } catch (_err) {
      const err = _err as AxiosError;
      throw new TalkifyError(
        err,
        'REQUEST_ERROR',
        err.response?.statusText ?? 'Could not synthetize the audio',
        err.response?.status,
      );
    }
  }

  public async availableVoices(language?: string): Promise<Voice[]> {
    try {
      const response = await this.connector.get('speech/v1/voices', { params: { key: this.defaultOptions.key } });

      // Sanitize response
      const voices: Voice[] = [];
      response.data.forEach((rawVoice: VoiceResponse) => {
        if (language && rawVoice.Language.toLowerCase() !== language.toLowerCase()) return;
        voices.push({
          culture: rawVoice.Culture,
          name: rawVoice.Name,
          gender: rawVoice.Gender,
          language: rawVoice.Language,
          supportedFormats: rawVoice.SupportedFormats.map((format) => format.toLowerCase()),
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
        });
      });

      return voices;
    } catch (_err) {
      const err = _err as AxiosError;
      throw new TalkifyError(
        err,
        'REQUEST_ERROR',
        err.response?.statusText ?? 'Could not fetch the voices list',
        err.response?.status,
      );
    }
  }

  public async detectLanguage(text: string): Promise<Language | null> {
    try {
      const response = await this.connector.get<DetectLanguageResponse>('language/v1/detect', {
        params: {
          text,
          key: this.defaultOptions.key,
        },
      });

      if (response.data.Language === -1) return null;
      return {
        name: response.data.LanguageName,
        cultures: response.data.Cultures,
      };
    } catch (_err) {
      const err = _err as AxiosError;
      throw new TalkifyError(
        err,
        'REQUEST_ERROR',
        err.response?.statusText ?? 'Could not fetch the language detection response',
        err.response?.status,
      );
    }
  }
}

export default Talkify;
