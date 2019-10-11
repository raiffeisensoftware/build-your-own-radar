import {capitalize, extractDomainName, extractFileName, extractQueryParams} from "../../src/util/util";

describe('Util functions', () => {
    it('should capitalize', () => {
        let capitalized = capitalize('bla');
        expect(capitalized).toEqual('Bla');
    });

    it('should extract the domain name', () => {
        let extractedDomainName = extractDomainName('https://www.r-software.at/karriere/');
        expect(extractedDomainName).toEqual('www.r-software.at');
    });

    it('should extract the file name', () => {
        let url = 'https://www.example.com/file.png';
        let fileName = extractFileName(url);
        expect(fileName).toEqual('file.png');
    });

    it('should extract the queryparams', () => {
        let url = 'https://www.example.com?param1=one&param2=two';
        let queryString = url.match(/\?(.*)/);
        let queryParams = queryString ? extractQueryParams(queryString[1]) : {};
        expect(queryParams).toEqual({param1: 'one', param2: 'two'});
    });
});