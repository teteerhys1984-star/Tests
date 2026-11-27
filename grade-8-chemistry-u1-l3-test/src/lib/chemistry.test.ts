import { describe, expect, it } from 'vitest';
import {
  atomCount,
  chargeBalance,
  formulaToTex,
  isCorrectFormula,
  isCorrectIon,
  parseFormula,
  parseInteger,
  plainChemText,
  sameAtoms,
} from './chemistry';

describe('atom counting and parentheses', () => {
  it.each([
    ['H2O', { H: 2, O: 1 }, 3],
    ['CO2', { C: 1, O: 2 }, 3],
    ['CH4', { C: 1, H: 4 }, 5],
    ['NH3', { N: 1, H: 3 }, 4],
    ['Al2(SO4)3', { Al: 2, S: 3, O: 12 }, 17],
    ['Ca(OH)2', { Ca: 1, O: 2, H: 2 }, 5],
    ['(NH4)2SO4', { N: 2, H: 8, S: 1, O: 4 }, 15],
    ['NaOH', { Na: 1, O: 1, H: 1 }, 3],
    ['AlPO4', { Al: 1, P: 1, O: 4 }, 6],
    ['Ca3(PO4)2', { Ca: 3, P: 2, O: 8 }, 13],
  ])('%s has the independently verified composition', (formula, atoms, total) => {
    const parsed = parseFormula(formula);
    expect(parsed?.atoms).toEqual(atoms);
    expect(parsed?.totalAtoms).toBe(total);
    expect(parsed?.charge).toBe(0);
  });

  it('applies an outside subscript to every atom, not just hydrogen', () => {
    expect(atomCount('CaOH2', 'O')).toBe(1);
    expect(atomCount('Ca(OH)2', 'O')).toBe(2);
  });

  it('does not confuse atom counts with ionic charges', () => {
    expect(atomCount('SO42-', 'O')).toBe(4);
    expect(parseFormula('SO42-')?.charge).toBe(-2);
  });

  it('rejects malformed, unsupported, wrong-case, and coefficient-prefixed formula responses', () => {
    ['Ca(OH2', 'Ca()', 'Xx2', 'naCl', 'NA2O', 'Zncl2', 'Al2(SO4)3junk', '3H2O', '', 'Al2(SO4)9999'].forEach(f =>
      expect(parseFormula(f)).toBeNull(),
    );
  });
});

describe('ionic notation and electrical neutrality', () => {
  it.each([
    ['Na+', 1],
    ['Ca2+', 2],
    ['Ca²⁺', 2],
    ['Al³⁺', 3],
    ['Mg2+', 2],
    ['Cl-', -1],
    ['O2-', -2],
    ['NO3-', -1],
    ['SO42-', -2],
    ['SO₄²⁻', -2],
    ['PO43-', -3],
    ['PO₄³⁻', -3],
    ['NH4+', 1],
    ['OH-', -1],
    ['CO32-', -2],
  ])('%s has charge %i', (formula, charge) => {
    expect(parseFormula(formula)?.charge).toBe(charge);
  });

  it('accepts genuine Unicode and spacing equivalents', () => {
    expect(isCorrectFormula('Al₂(SO₄)₃', 'Al2(SO4)3')).toBe(true);
    expect(isCorrectFormula(' Ca (OH) 2 ', 'Ca(OH)2')).toBe(true);
    expect(isCorrectIon('Ca²⁺', 'Ca2+')).toBe(true);
    expect(isCorrectIon('Al³⁺', 'Al3+')).toBe(true);
    expect(isCorrectIon('SO₄²⁻', 'SO42-')).toBe(true);
    expect(isCorrectIon('PO₄³⁻', 'PO43-')).toBe(true);
    expect(isCorrectIon('Na⁺', 'Na+')).toBe(true);
    expect(parseFormula('Na¹⁺')?.charge).toBe(1);
  });

  it('rejects unreduced ratios, wrong ratios, missing parentheses, and reordered components', () => {
    ['Ca2O2', 'Al4O6', 'AlO', 'CaOH2', 'Al2SO43', 'Cl2Zn', 'Al(PO4)', 'Ca1O1', 'Al2(SO4)3+', 'Al3(PO4)3'].forEach(f =>
      expect(
        isCorrectFormula(
          f,
          f === 'Al3(PO4)3' || f === 'Al(PO4)'
            ? 'AlPO4'
            : f === 'Cl2Zn'
              ? 'ZnCl2'
              : f === 'Ca2O2' || f === 'Ca1O1'
                ? 'CaO'
                : f === 'Al4O6' || f === 'AlO'
                  ? 'Al2O3'
                  : f === 'CaOH2'
                    ? 'Ca(OH)2'
                    : 'Al2(SO4)3',
        ),
      ).toBe(false),
    );
  });

  it('distinguishes equivalent atom counts from acceptable radical notation', () => {
    expect(sameAtoms('Al2(SO4)3', 'Al2S3O12')).toBe(true);
    expect(isCorrectFormula('Al2S3O12', 'Al2(SO4)3')).toBe(false);
    expect(isCorrectFormula('Ca2O2', 'CaO')).toBe(false);
  });

  it.each([
    ['Al2(SO4)3', 'Al3+', 'SO42-', 6, -6, 2, 3],
    ['Ca3(PO4)2', 'Ca2+', 'PO43-', 6, -6, 3, 2],
    ['ZnCl2', 'Zn2+', 'Cl-', 2, -2, 1, 2],
    ['NaOH', 'Na+', 'OH-', 1, -1, 1, 1],
    ['AlPO4', 'Al3+', 'PO43-', 3, -3, 1, 1],
  ])('verifies charge balance for %s', (formula, cation, anion, positive, negative, nc, na) => {
    const b = chargeBalance(formula, cation, anion);
    expect(b?.positive).toBe(positive);
    expect(b?.negative).toBe(negative);
    expect(b?.net).toBe(0);
    expect(b?.cationCount).toBe(nc);
    expect(b?.anionCount).toBe(na);
    expect(b?.simplest).toBe(true);
  });

  it('does not call an unbalanced or radical-distorting formula neutral', () => {
    expect(chargeBalance('AlO', 'Al3+', 'O2-')?.net).toBe(1);
    expect(chargeBalance('CaOH2', 'Ca2+', 'OH-')).toBeNull();
    expect(chargeBalance('Al3(PO4)3', 'Al3+', 'PO43-')?.simplest).toBe(false);
  });
});

describe('numeric and rendering contracts', () => {
  it('compares integers numerically and rejects unrelated prose', () => {
    expect(parseInteger('١٢')).toBe(12);
    expect(parseInteger('0012')).toBe(12);
    expect(parseInteger('۱۲')).toBe(12);
    expect(parseInteger('12 ذرة')).toBeNull();
    expect(parseInteger('answer 12')).toBeNull();
    expect(parseInteger('1.5')).toBeNull();
    expect(parseInteger('-3')).toBe(-3);
  });

  it('produces upright chemical symbols and real subscripts', () => {
    expect(formulaToTex('Al2(SO4)3')).toBe('\\mathrm{Al}_{2}(\\mathrm{S}\\mathrm{O}_{4})_{3}');
    expect(formulaToTex('SO42-')).toContain('^{2-}');
    expect(formulaToTex('3CO2').startsWith('3\\mathrm{C}')).toBe(true);
  });

  it('expands braced chemical formulas to clean Unicode plain text', () => {
    expect(plainChemText('تكافؤ الكبريتات {{SO42-}} في {{Al2(SO4)3}}')).toBe('تكافؤ الكبريتات SO₄²⁻ في Al₂(SO₄)₃');
  });
});
