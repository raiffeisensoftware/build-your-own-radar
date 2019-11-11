import ContentValidator from "../../src/util/contentValidator";

describe('ContentValidator', () => {
    it('should initialize', () => {
        let contentValidator = new ContentValidator(['id', 'name', 'ring', 'quadrant', 'isNew', 'description']);
        expect(contentValidator).toBeDefined();
    });

    it('should verify content', () => {
        let contentValidator = new ContentValidator(['id', 'name', 'ring', 'quadrant', 'isNew', 'description']);
        expect(() => {
            contentValidator.verifyContent();
        }).not.toThrow();
    });

    it('should not verify wrong content', () => {
        let wrongContentValidator = new ContentValidator([]);
        expect(() => {
            wrongContentValidator.verifyContent();
        }).toThrow();
    });

    it('should verify headers', () => {
        let contentValidator = new ContentValidator(['id', 'name', 'ring', 'quadrant', 'isNew', 'description']);
        expect(() => {
            contentValidator.verifyHeaders()
        }).not.toThrow();
    });

    it('should not verify wrong headers', () => {
        let wrongContentValidator = new ContentValidator([]);

        expect(() => {
            wrongContentValidator.verifyHeaders()
        }).toThrow();
    });
});