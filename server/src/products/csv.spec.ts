import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('parses the header and fields, ignoring a BOM and CRLF', () => {
    const rows = parseCsv(
      '\uFEFFnome,preço\r\nCamiseta,59.90\r\nCalça,120\r\n',
    );

    expect(rows).toEqual([
      ['nome', 'preço'],
      ['Camiseta', '59.90'],
      ['Calça', '120'],
    ]);
  });

  it('supports quoted fields with commas, quotes and line breaks', () => {
    const rows = parseCsv(
      'nome,descrição\n"Camiseta, azul","Linha ""premium""\nsegunda linha"',
    );

    expect(rows).toEqual([
      ['nome', 'descrição'],
      ['Camiseta, azul', 'Linha "premium"\nsegunda linha'],
    ]);
  });

  it('keeps empty fields', () => {
    expect(parseCsv('a,b,c\n1,,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
    ]);
  });
});
