async function searchDOI(keyword){
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(keyword)}&rows=5`;
  const res = await fetch(url);
  const data = await res.json();
  return data.message.items.map(item => ({
    title: item.title[0],
    authors: item.author?.map(a => a.given + ' ' + a.family).join(', ') || '',
    year: item.published['date-parts'][0][0],
    journal: item['container-title'][0] || '',
    doi: item.DOI,
    url: item.URL
  }));
}

// Usage:
searchDOI("quantum mechanics").then(results => console.log(results));
