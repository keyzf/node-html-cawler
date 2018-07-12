const fs = require('fs');
const Crawler = require('../crawler');

const domain = process.argv[2];
const crawler = new Crawler(domain);
const siteTree = {pages: [], urls: {}, redirects: {}};

crawler.crawl();
crawler.on('data', data => {
    siteTree.urls[data.url] = data.result.statusCode;
    siteTree.pages.push({
        url: data.url,
        links: data.result.links
    });

    if(/30\d/.test(data.result.statusCode)) siteTree.redirects[data.url] = data.result.links[0].url;
});
crawler.on('error', error => console.error(error));
crawler.on('end', () => {
    fs.writeFileSync(`${__dirname}/result.csv`, 'url;href;status\r\n');

    for(let pageIndex in siteTree.pages) {
        const urlOfPage = siteTree.pages[pageIndex].url;

        for(let linkIndex in siteTree.pages[pageIndex].links) {
            const urlOfLink = siteTree.pages[pageIndex].links[linkIndex].url;

            if(urlOfLink) {
                const hrefOfLink = siteTree.pages[pageIndex].links[linkIndex].href;
                const statusCodeOfLink = (/30\d/.test(siteTree.urls[urlOfLink])) ? getFinalStatusCodeOfRedirects(urlOfLink) : siteTree.urls[urlOfLink];

                fs.appendFileSync(`${__dirname}/result.csv`, `${urlOfPage};${hrefOfLink};${statusCodeOfLink}\r\n`);
            }
        }
    }

    console.log(`Finish! All links on page on domain ${domain} a checked!`);
});

function getFinalStatusCodeOfRedirects(url) {
    if(/30\d/.test(siteTree.urls[url])) {
        return getFinalStatusCodeOfRedirects(siteTree.redirects[url]);
    } else {
        return siteTree.urls[url];
    }
}