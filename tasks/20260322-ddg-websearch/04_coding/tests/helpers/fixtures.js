function createDdgHtml() {
  return `
    <html>
      <body>
        <div class="results">
          <article class="result">
            <a class="result__a" href="https://example.com/alpha">Alpha Result</a>
            <a class="result__snippet">Alpha snippet</a>
          </article>
          <article class="result">
            <a class="result__a" href="https://example.com/beta">Beta Result</a>
            <a class="result__snippet">Beta snippet</a>
          </article>
        </div>
        <div class="related-searches">
          <a href="/html/?q=alpha+news">alpha news</a>
          <a href="/html/?q=alpha+docs">alpha docs</a>
        </div>
      </body>
    </html>
  `;
}

function createDdgEmptyHtml() {
  return `
    <html>
      <body>
        <div class="results--empty">No results found for test query</div>
      </body>
    </html>
  `;
}

function createDdgBlockedHtml() {
  return `
    <html>
      <body>
        <form id="challenge-form">captcha required</form>
      </body>
    </html>
  `;
}

function createBingHtml() {
  return `
    <html>
      <body>
        <ol id="b_results">
          <li class="b_algo">
            <h2><a href="https://bing.example.com/one">Bing One</a></h2>
            <div class="b_caption"><p>Bing snippet one</p></div>
          </li>
          <li class="b_algo">
            <h2><a href="https://bing.example.com/two">Bing Two</a></h2>
            <div class="b_caption"><p>Bing snippet two</p></div>
          </li>
        </ol>
      </body>
    </html>
  `;
}

function createSearchResponse(overrides = {}) {
  return {
    query: 'openclaw',
    results: [
      {
        title: 'Alpha Result',
        url: 'https://example.com/alpha',
        snippet: 'Alpha snippet',
        source: 'ddg',
      },
    ],
    relatedSearches: ['alpha news'],
    sourceUsed: 'ddg',
    outputMode: 'detailed',
    tookMs: 42,
    partial: false,
    fallbackUsed: false,
    error: null,
    ...overrides,
  };
}

module.exports = {
  createBingHtml,
  createDdgBlockedHtml,
  createDdgEmptyHtml,
  createDdgHtml,
  createSearchResponse,
};
