import { describe, it, expect, vi } from 'vitest';
import {
  extractCandidateName,
  getCapibarismoSlug,
  buildCapibarismoUrl,
  CAPIBARISMO_CANDIDATE_MAP,
} from '../../src/constants/capibarismoMapping';

describe('extractCandidateName', () => {
  it('strips party suffix in parentheses', () => {
    expect(extractCandidateName('Ana García (Partido Verde)')).toBe('Ana García');
  });

  it('does not strip bracket suffixes (only parentheses are stripped)', () => {
    expect(extractCandidateName('Luis Torres [Alianza]')).toBe('Luis Torres [Alianza]');
  });

  it('returns the full name when there is no suffix', () => {
    expect(extractCandidateName('Keiko Fujimori')).toBe('Keiko Fujimori');
  });

  it('returns empty string for null input', () => {
    expect(extractCandidateName(null)).toBe('');
  });

  it('returns empty string for non-string input', () => {
    expect(extractCandidateName(42)).toBe('');
  });
});

describe('getCapibarismoSlug', () => {
  it('returns the correct slug for a known candidate', () => {
    expect(getCapibarismoSlug('Keiko Fujimori')).toBe('keiko-fujimori');
  });

  it('extracts the candidate name from a name with party before looking up', () => {
    expect(getCapibarismoSlug('Rafael López Aliaga (Renovación Popular)')).toBe('rafael-lopezaliaga');
  });

  it('returns null for an unknown candidate', () => {
    expect(getCapibarismoSlug('Candidato Desconocido')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getCapibarismoSlug('')).toBeNull();
  });

  it('handles duplicate-name aliases correctly (Darwin / Ronald Atencio)', () => {
    expect(getCapibarismoSlug('Darwin Atencio')).toBe('ronald-atencio');
    expect(getCapibarismoSlug('Ronald Atencio')).toBe('ronald-atencio');
  });
});

describe('buildCapibarismoUrl', () => {
  it('builds a URL with the first 4 candidates slugs', () => {
    const candidates = [
      { displayName: 'Keiko Fujimori' },
      { displayName: 'César Acuña' },
      { displayName: 'Rafael López Aliaga' },
      { displayName: 'George Forsyth' },
    ];
    const url = buildCapibarismoUrl(candidates);
    expect(url).toContain('capibarismo.com/jugar');
    expect(url).toContain('keiko-fujimori');
    expect(url).toContain('cesar-acuna');
    expect(url).toContain('rafael-lopezaliaga');
    expect(url).toContain('george-forsyth');
    expect(url).toMatch(/semifinal=[\w-]+(,[\w-]+){3}/);
  });

  it('uses only the first 4 candidates even when more are provided', () => {
    const candidates = [
      { displayName: 'Keiko Fujimori' },
      { displayName: 'César Acuña' },
      { displayName: 'Rafael López Aliaga' },
      { displayName: 'George Forsyth' },
      { displayName: 'Jorge Nieto' },
    ];
    const url = buildCapibarismoUrl(candidates);
    const slugPart = url.split('semifinal=')[1];
    expect(slugPart.split(',').length).toBe(4);
  });

  it('falls back gracefully when a candidate has no mapping (warns and excludes)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const candidates = [
      { displayName: 'Candidato Desconocido' },
      { displayName: 'Keiko Fujimori' },
      { displayName: 'César Acuña' },
      { displayName: 'Rafael López Aliaga' },
    ];
    const url = buildCapibarismoUrl(candidates);
    expect(warnSpy).toHaveBeenCalled();
    expect(url).toContain('keiko-fujimori');
    warnSpy.mockRestore();
  });

  it('falls back to the name property when displayName is absent', () => {
    const candidates = [
      { name: 'Keiko Fujimori' },
      { name: 'César Acuña' },
      { name: 'Rafael López Aliaga' },
      { name: 'George Forsyth' },
    ];
    const url = buildCapibarismoUrl(candidates);
    expect(url).toContain('keiko-fujimori');
  });
});
