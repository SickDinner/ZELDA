import { Howl, HowlOptions } from 'howler';

export interface AudioClip {
  id: string;
  howl: Howl;
  category: 'sfx' | 'music' | 'voice';
  volume: number;
  loop: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
  muted: boolean;
}

export class AudioManager {
  private static instance: AudioManager | null = null;
  
  private clips = new Map<string, AudioClip>();
  private loadingPromises = new Map<string, Promise<AudioClip>>();
  private currentMusic: AudioClip | null = null;
  private settings: AudioSettings;

  private constructor() {
    this.settings = {
      masterVolume: 1.0,
      sfxVolume: 1.0,
      musicVolume: 0.7,
      voiceVolume: 1.0,
      muted: false
    };

    // Set up global Howler settings
    Howler.volume(this.settings.masterVolume);
    
    // Handle browser audio context policy
    this.setupAudioContext();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private setupAudioContext(): void {
    // Modern browsers require user interaction to start audio
    const enableAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().then(() => {
          console.log('🔊 Audio context resumed');
        });
      }
    };

    // Add event listeners for user interaction
    const events = ['click', 'keydown', 'touchstart'];
    const handler = () => {
      enableAudio();
      events.forEach(event => {
        document.removeEventListener(event, handler);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, handler, { once: true });
    });
  }

  /**
   * Load an audio clip
   */
  public async loadAudio(
    id: string,
    src: string | string[],
    category: 'sfx' | 'music' | 'voice' = 'sfx',
    options: Partial<HowlOptions> = {}
  ): Promise<AudioClip> {
    if (this.clips.has(id)) {
      return this.clips.get(id)!;
    }

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    const promise = new Promise<AudioClip>((resolve, reject) => {
      const defaultOptions: HowlOptions = {
        src: Array.isArray(src) ? src : [src],
        volume: this.getCategoryVolume(category),
        loop: category === 'music',
        preload: true,
        html5: category === 'music', // Use HTML5 Audio for music (streaming)
        ...options
      };

      const howl = new Howl({
        ...defaultOptions,
        onload: () => {
          const clip: AudioClip = {
            id,
            howl,
            category,
            volume: defaultOptions.volume || 1,
            loop: defaultOptions.loop || false
          };

          this.clips.set(id, clip);
          this.loadingPromises.delete(id);
          
          console.log(`🎵 Loaded ${category}: ${id}`);
          resolve(clip);
        },
        onloaderror: (_soundId, error) => {
          this.loadingPromises.delete(id);
          console.error(`❌ Failed to load ${category}: ${id}`, error);
          reject(new Error(`Failed to load audio: ${id}`));
        }
      });
    });

    this.loadingPromises.set(id, promise);
    return promise;
  }

  /**
   * Play a sound effect
   */
  public playSFX(id: string, options: {
    volume?: number;
    rate?: number;
    loop?: boolean;
  } = {}): number | null {
    const clip = this.clips.get(id);
    if (!clip) {
      console.warn(`⚠️ Audio clip not found: ${id}`);
      return null;
    }

    if (this.settings.muted) {
      return null;
    }

    const soundId = clip.howl.play();
    
    if (options.volume !== undefined) {
      clip.howl.volume(options.volume * this.getCategoryVolume(clip.category), soundId);
    }
    
    if (options.rate !== undefined) {
      clip.howl.rate(options.rate, soundId);
    }

    if (options.loop !== undefined) {
      clip.howl.loop(options.loop, soundId);
    }

    return soundId;
  }

  /**
   * Play background music with crossfade
   */
  public async playMusic(
    id: string,
    fadeInDuration: number = 1000,
    crossfade: boolean = true
  ): Promise<void> {
    const newClip = this.clips.get(id);
    if (!newClip) {
      console.warn(`⚠️ Music not found: ${id}`);
      return;
    }

    if (this.settings.muted) {
      return;
    }

    // Handle crossfade with current music
    if (this.currentMusic && crossfade) {
      const fadeOutDuration = fadeInDuration / 2;
      this.fadeOut(this.currentMusic.id, fadeOutDuration);
      
      // Wait a bit before starting new music
      await new Promise(resolve => setTimeout(resolve, fadeOutDuration / 2));
    } else if (this.currentMusic) {
      this.stopMusic();
    }

    this.currentMusic = newClip;
    const soundId = newClip.howl.play();

    // Fade in new music
    if (fadeInDuration > 0) {
      newClip.howl.volume(0, soundId);
      newClip.howl.fade(0, this.getCategoryVolume('music'), fadeInDuration, soundId);
    }

    console.log(`🎶 Now playing: ${id}`);
  }

  /**
   * Stop current background music
   */
  public stopMusic(fadeOutDuration: number = 500): void {
    if (this.currentMusic) {
      if (fadeOutDuration > 0) {
        this.fadeOut(this.currentMusic.id, fadeOutDuration);
        setTimeout(() => {
          this.currentMusic?.howl.stop();
          this.currentMusic = null;
        }, fadeOutDuration);
      } else {
        this.currentMusic.howl.stop();
        this.currentMusic = null;
      }
    }
  }

  /**
   * Fade out audio clip
   */
  public fadeOut(id: string, duration: number = 1000): void {
    const clip = this.clips.get(id);
    if (clip) {
      clip.howl.fade(clip.howl.volume(), 0, duration);
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  public setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.settings.masterVolume);
  }

  /**
   * Set category volume (0.0 to 1.0)
   */
  public setCategoryVolume(category: keyof AudioSettings, volume: number): void {
    const key = `${category}Volume` as keyof AudioSettings;
    if (key in this.settings) {
      (this.settings as any)[key] = Math.max(0, Math.min(1, volume));
      
      // Update all clips of this category
      this.clips.forEach(clip => {
        if (clip.category === category.replace('Volume', '') as any) {
          clip.howl.volume(this.getCategoryVolume(clip.category));
        }
      });
    }
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    Howler.mute(this.settings.muted);
    
    console.log(`🔇 Audio ${this.settings.muted ? 'muted' : 'unmuted'}`);
    return this.settings.muted;
  }

  /**
   * Get effective volume for a category
   */
  private getCategoryVolume(category: 'sfx' | 'music' | 'voice'): number {
    const categoryVolume = this.settings[`${category}Volume`];
    return categoryVolume * this.settings.masterVolume;
  }

  /**
   * Preload multiple audio files
   */
  public async preloadAudio(audioFiles: Array<{
    id: string;
    src: string | string[];
    category: 'sfx' | 'music' | 'voice';
    options?: Partial<HowlOptions>;
  }>): Promise<AudioClip[]> {
    const promises = audioFiles.map(file => 
      this.loadAudio(file.id, file.src, file.category, file.options)
    );

    const results = await Promise.allSettled(promises);
    const successful: AudioClip[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        console.error(`❌ Failed to load audio ${audioFiles[index].id}:`, result.reason);
      }
    });

    console.log(`✅ Preloaded ${successful.length}/${audioFiles.length} audio files`);
    return successful;
  }

  /**
   * Get current settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Get currently playing music
   */
  public getCurrentMusic(): AudioClip | null {
    return this.currentMusic;
  }

  /**
   * Check if audio is loaded
   */
  public isLoaded(id: string): boolean {
    return this.clips.has(id);
  }

  /**
   * Get all loaded audio clip IDs
   */
  public getLoadedClips(): string[] {
    return Array.from(this.clips.keys());
  }

  /**
   * Create SNES-style sound effects using Web Audio API
   */
  public createSNESSound(
    _id: string,
    type: 'coin' | 'jump' | 'hit' | 'powerup' | 'beep',
    frequency: number = 440,
    duration: number = 0.2
  ): void {
    // Create a simple procedural sound effect
    const audioContext = Howler.ctx;
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure based on sound type
    switch (type) {
      case 'coin':
        oscillator.frequency.setValueAtTime(988, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        break;
      case 'jump':
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 2, audioContext.currentTime + duration);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        break;
      case 'hit':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioContext.currentTime + duration);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        break;
      case 'powerup':
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(frequency * 1.5, audioContext.currentTime + 0.05);
        oscillator.frequency.setValueAtTime(frequency * 2, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        break;
      case 'beep':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + duration);
        break;
    }

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);

    console.log(`🔊 Created SNES-style ${type} sound`);
  }

  /**
   * Clean up all audio resources
   */
  public dispose(): void {
    this.clips.forEach(clip => {
      clip.howl.unload();
    });
    
    this.clips.clear();
    this.loadingPromises.clear();
    this.currentMusic = null;
    
    console.log('🧹 AudioManager disposed');
  }
}