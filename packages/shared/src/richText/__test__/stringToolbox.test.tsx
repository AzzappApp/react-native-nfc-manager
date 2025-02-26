import { parseHTMLToRichText } from '../stringToolbox';

describe('RichText: parseHTML', () => {
  describe('ParseHTML', () => {
    test('empty text', () => {
      const result = parseHTMLToRichText('');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[],"start":0,"end":0}',
      );
    });
    test('simple text', () => {
      const result = parseHTMLToRichText('ab');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"text","value":"ab","start":0,"end":2}],"start":0,"end":2}',
      );
    });
    test('simple with tag first', () => {
      const result = parseHTMLToRichText('<i>a</i>b');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"i","start":0,"end":1,"children":[{"type":"text","value":"a","start":0,"end":1}]},{"type":"text","value":"b","start":1,"end":2}],"start":0,"end":2}',
      );
    });
    test('simple with tag end', () => {
      const result = parseHTMLToRichText('a<i>b</i>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"text","value":"a","start":0,"end":1},{"type":"i","start":1,"end":2,"children":[{"type":"text","value":"b","start":1,"end":2}]}],"start":0,"end":2}',
      );
    });
    test('simple with tag full', () => {
      const result = parseHTMLToRichText('<i>ab</i>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"i","start":0,"end":2,"children":[{"type":"text","value":"ab","start":0,"end":2}]}],"start":0,"end":2}',
      );
    });
    test('double with tags', () => {
      const result = parseHTMLToRichText('<i>a</i><i>a</i>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"i","start":0,"end":1,"children":[{"type":"text","value":"a","start":0,"end":1}]},{"type":"i","start":1,"end":2,"children":[{"type":"text","value":"a","start":1,"end":2}]}],"start":0,"end":2}',
      );
    });
    test('triple with tags', () => {
      const result = parseHTMLToRichText('<i>a</i><i>a</i><i>a</i>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"i","start":0,"end":1,"children":[{"type":"text","value":"a","start":0,"end":1}]},{"type":"i","start":1,"end":2,"children":[{"type":"text","value":"a","start":1,"end":2}]},{"type":"i","start":2,"end":3,"children":[{"type":"text","value":"a","start":2,"end":3}]}],"start":0,"end":3}',
      );
    });
    test('simple error', () => {
      const result = parseHTMLToRichText('<i>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"text","value":"<i>","start":0,"end":3}],"start":0,"end":3}',
      );
    });
    describe('nested tag', () => {
      test('nested full content', () => {
        const result = parseHTMLToRichText('<i><b>ab</b></i>');
        expect(JSON.stringify(result)).toBe(
          '{"type":"root","children":[{"type":"i","start":0,"end":2,"children":[{"type":"b","start":0,"end":2,"children":[{"type":"text","value":"ab","start":0,"end":2}]}]}],"start":0,"end":2}',
        );
      });
      test('nested content with next and previous content', () => {
        const result = parseHTMLToRichText('a<i><b>a</b></i>a');
        expect(JSON.stringify(result)).toBe(
          '{"type":"root","children":[{"type":"text","value":"a","start":0,"end":1},{"type":"i","start":1,"end":2,"children":[{"type":"b","start":1,"end":2,"children":[{"type":"text","value":"a","start":1,"end":2}]}]},{"type":"text","value":"a","start":2,"end":3}],"start":0,"end":3}',
        );
      });
    });
    test('nested tags 3', () => {
      const result = parseHTMLToRichText('a<b><i>b</i></b>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"text","value":"a","start":0,"end":1},{"type":"b","start":1,"end":2,"children":[{"type":"i","start":1,"end":2,"children":[{"type":"text","value":"b","start":1,"end":2}]}]}],"start":0,"end":2}',
      );
    });
    test('partial nested 1', () => {
      const result = parseHTMLToRichText('<i><b>a</b>b</i>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"i","start":0,"end":2,"children":[{"type":"b","start":0,"end":1,"children":[{"type":"text","value":"a","start":0,"end":1}]},{"type":"text","value":"b","start":1,"end":2}]}],"start":0,"end":2}',
      );
    });
    test('partial nested 2', () => {
      const result = parseHTMLToRichText('<i>a<b>b</b></i>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"i","start":0,"end":2,"children":[{"type":"text","value":"a","start":0,"end":1},{"type":"b","start":1,"end":2,"children":[{"type":"text","value":"b","start":1,"end":2}]}]}],"start":0,"end":2}',
      );
    });
    test('nested error', () => {
      const result = parseHTMLToRichText('<i>a<b></i></b>');
      expect(JSON.stringify(result)).toBe(
        '{"type":"root","children":[{"type":"i","start":0,"end":4,"children":[{"type":"text","value":"a<b>","start":0,"end":4}]},{"type":"text","value":"</b>","start":4,"end":8}],"start":0,"end":8}',
      );
    });
  });
});
