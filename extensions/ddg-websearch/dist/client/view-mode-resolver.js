function resolveOutputMode(options = {}) {
  return options.outputMode === 'detailed' ? 'detailed' : 'summary';
}

function mapResponseToSummaryView(response) {
  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
  }));
}

function mapResponseToDetailedView(response) {
  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
    snippet: result.snippet || '',
    source: result.source,
  }));
}

module.exports = {
  mapResponseToDetailedView,
  mapResponseToSummaryView,
  resolveOutputMode,
};
