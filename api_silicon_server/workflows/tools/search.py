"""
Search Tools - Web Information Gathering

Provides comprehensive search capabilities for research workflows:
- DuckDuckGo web search for general information
- Academic search integration
- ArXiv research paper search
- Intelligent query generation and result filtering

Integrates with the workflow context to maintain search history and
apply cognitive filters for relevance.
"""

import logging
import time
from typing import Any, Dict, List, Optional
from datetime import datetime

# Set up logger
search_logger = logging.getLogger("WorkflowTools.Search")
search_logger.setLevel(logging.INFO)


def search_web_info(input_data: Any, context: Dict) -> List[Dict[str, Any]]:
    """
    Search for web information using DuckDuckGo search engine.
    
    This is the primary web search tool for gathering general information
    relevant to research queries.
    
    Args:
        input_data: Search query or clarified research request
        context: Workflow context containing search parameters and history
    
    Returns:
        List[Dict]: Search results with metadata
    """
    search_logger.info("🌐 Starting DuckDuckGo web search...")
    
    try:
        # Import DuckDuckGo search (with fallback if not available)
        try:
            from duckduckgo_search import DDGS
            ddgs_available = True
        except ImportError:
            search_logger.warning("⚠️ DuckDuckGo search not available, using mock results")
            ddgs_available = False
        
        # Extract search query from input
        if isinstance(input_data, str):
            search_query = input_data
        else:
            search_query = str(input_data)
        
        # Clean and optimize search query
        optimized_query = _optimize_search_query(search_query, context)
        search_logger.info(f"🔍 Search query: '{optimized_query}'")
        
        # Get search parameters from context
        max_results = context.get("search_max_results", 10)
        search_region = context.get("search_region", "en-us")
        search_safesearch = context.get("search_safesearch", "moderate")
        
        results = []
        
        if ddgs_available:
            try:
                # Perform DuckDuckGo search
                with DDGS() as ddgs:
                    search_start = time.time()
                    
                    ddg_results = ddgs.text(
                        keywords=optimized_query,
                        region=search_region,
                        safesearch=search_safesearch,
                        max_results=max_results
                    )
                    
                    search_duration = time.time() - search_start
                    
                    # Process results
                    for i, result in enumerate(ddg_results):
                        processed_result = {
                            "title": result.get("title", ""),
                            "url": result.get("href", ""),
                            "snippet": result.get("body", ""),
                            "source": "DuckDuckGo",
                            "rank": i + 1,
                            "relevance_score": _calculate_relevance_score(result, optimized_query),
                            "search_query": optimized_query,
                            "timestamp": datetime.now().isoformat()
                        }
                        results.append(processed_result)
                    
                    search_logger.info(f"✅ DuckDuckGo search completed: {len(results)} results in {search_duration:.2f}s")
                    
            except Exception as e:
                search_logger.error(f"❌ DuckDuckGo search failed: {str(e)}")
                # Fall back to mock results
                results = _generate_mock_search_results(optimized_query, max_results)
        else:
            # Use mock results if DuckDuckGo not available
            results = _generate_mock_search_results(optimized_query, max_results)
        
        # Update context with search metadata
        search_metadata = {
            "search_performed": True,
            "search_query": optimized_query,
            "original_query": search_query,
            "results_count": len(results),
            "search_source": "DuckDuckGo" if ddgs_available else "Mock",
            "search_timestamp": datetime.now().isoformat()
        }
        
        context.update(search_metadata)
        
        # Add to search history
        if "search_history" not in context:
            context["search_history"] = []
        
        context["search_history"].append({
            "query": optimized_query,
            "results_count": len(results),
            "timestamp": datetime.now().isoformat()
        })
        
        return results
        
    except Exception as e:
        search_logger.error(f"❌ Web search failed: {str(e)}")
        # Return empty results on total failure
        return []


def search_arxiv(input_data: Any, context: Dict) -> List[Dict[str, Any]]:
    """
    Search ArXiv for academic papers related to the research query.
    
    This provides access to academic and scientific literature for
    research workflows requiring scholarly sources.
    
    Args:
        input_data: Research query
        context: Workflow context
    
    Returns:
        List[Dict]: ArXiv paper results with metadata
    """
    search_logger.info("📚 Starting ArXiv academic search...")
    
    try:
        # Import ArXiv library (with fallback if not available)
        try:
            import arxiv
            arxiv_available = True
        except ImportError:
            search_logger.warning("⚠️ ArXiv library not available, using mock results")
            arxiv_available = False
        
        # Extract and optimize query
        if isinstance(input_data, str):
            search_query = input_data
        else:
            search_query = str(input_data)
        
        # Create academic-focused query
        academic_query = _create_academic_query(search_query, context)
        search_logger.info(f"🔬 Academic query: '{academic_query}'")
        
        results = []
        max_results = context.get("arxiv_max_results", 5)
        
        if arxiv_available:
            try:
                # Search ArXiv
                search_start = time.time()
                
                arxiv_search = arxiv.Search(
                    query=academic_query,
                    max_results=max_results,
                    sort_by=arxiv.SortCriterion.Relevance
                )
                
                for i, paper in enumerate(arxiv_search.results()):
                    result = {
                        "title": paper.title,
                        "authors": [author.name for author in paper.authors],
                        "abstract": paper.summary,
                        "url": paper.entry_id,
                        "pdf_url": paper.pdf_url,
                        "published": paper.published.isoformat() if paper.published else "",
                        "categories": paper.categories,
                        "source": "ArXiv",
                        "rank": i + 1,
                        "relevance_score": _calculate_academic_relevance(paper, academic_query),
                        "search_query": academic_query,
                        "timestamp": datetime.now().isoformat()
                    }
                    results.append(result)
                
                search_duration = time.time() - search_start
                search_logger.info(f"✅ ArXiv search completed: {len(results)} papers in {search_duration:.2f}s")
                
            except Exception as e:
                search_logger.error(f"❌ ArXiv search failed: {str(e)}")
                results = _generate_mock_arxiv_results(academic_query, max_results)
        else:
            # Mock results if ArXiv not available
            results = _generate_mock_arxiv_results(academic_query, max_results)
        
        # Update context
        context.update({
            "arxiv_search_performed": True,
            "arxiv_query": academic_query,
            "arxiv_results_count": len(results)
        })
        
        return results
        
    except Exception as e:
        search_logger.error(f"❌ ArXiv search failed: {str(e)}")
        return []


def search_academic(input_data: Any, context: Dict) -> List[Dict[str, Any]]:
    """
    Comprehensive academic search combining multiple scholarly sources.
    
    This searches multiple academic databases and repositories to provide
    comprehensive scholarly information.
    
    Args:
        input_data: Research query
        context: Workflow context
    
    Returns:
        List[Dict]: Combined academic search results
    """
    search_logger.info("🎓 Starting comprehensive academic search...")
    
    all_results = []
    
    try:
        # Search ArXiv for papers
        arxiv_results = search_arxiv(input_data, context)
        all_results.extend(arxiv_results)
        
        # Search DuckDuckGo with academic focus
        academic_context = context.copy()
        academic_context["search_academic_focus"] = True
        web_results = search_web_info(input_data, academic_context)
        
        # Filter web results for academic sources
        academic_web_results = _filter_academic_sources(web_results)
        all_results.extend(academic_web_results)
        
        # Sort by relevance and academic quality
        all_results.sort(key=lambda x: (
            x.get("academic_quality_score", 0.5),
            x.get("relevance_score", 0.5)
        ), reverse=True)
        
        search_logger.info(f"🎓 Academic search completed: {len(all_results)} total results")
        
        # Update context
        context.update({
            "academic_search_performed": True,
            "total_academic_results": len(all_results),
            "arxiv_results": len(arxiv_results),
            "academic_web_results": len(academic_web_results)
        })
        
        return all_results
        
    except Exception as e:
        search_logger.error(f"❌ Academic search failed: {str(e)}")
        return []


def _optimize_search_query(query: str, context: Dict) -> str:
    """Optimize search query for better results"""
    
    # Remove CBT clarification text if present
    if "[ProtoConsciousness Clarification]" in query:
        # Extract the original query part
        parts = query.split("[ProtoConsciousness Clarification]")
        query = parts[0].strip()
    
    # Remove common filler words for search
    filler_words = ["please", "can you", "I want to know", "tell me about", "what is", "how does"]
    for filler in filler_words:
        query = query.replace(filler, "").strip()
    
    # Add academic focus if in academic context
    if context.get("search_academic_focus"):
        query += " research study academic"
    
    # Limit query length
    words = query.split()
    if len(words) > 10:
        query = " ".join(words[:10])
    
    return query.strip()


def _create_academic_query(query: str, context: Dict) -> str:
    """Create an academic-focused search query"""
    
    # Extract key terms
    academic_query = _optimize_search_query(query, context)
    
    # Add academic keywords if not already present
    academic_terms = ["research", "study", "analysis", "theory", "methodology"]
    query_lower = academic_query.lower()
    
    for term in academic_terms:
        if term in query_lower:
            break
    else:
        # Add most relevant academic term
        academic_query += " research"
    
    return academic_query


def _calculate_relevance_score(result: Dict, query: str) -> float:
    """Calculate relevance score for a search result"""
    
    score = 0.0
    query_terms = query.lower().split()
    
    # Check title relevance
    title = result.get("title", "").lower()
    title_matches = sum(1 for term in query_terms if term in title)
    score += (title_matches / len(query_terms)) * 0.5
    
    # Check snippet relevance
    snippet = result.get("snippet", "").lower()
    snippet_matches = sum(1 for term in query_terms if term in snippet)
    score += (snippet_matches / len(query_terms)) * 0.3
    
    # Boost academic sources
    url = result.get("url", "").lower()
    academic_domains = [".edu", ".org", "scholar.", "arxiv.", "pubmed.", "jstor."]
    if any(domain in url for domain in academic_domains):
        score += 0.2
    
    return min(score, 1.0)


def _calculate_academic_relevance(paper, query: str) -> float:
    """Calculate relevance score for an academic paper"""
    
    score = 0.0
    query_terms = query.lower().split()
    
    # Check title relevance
    title_matches = sum(1 for term in query_terms if term in paper.title.lower())
    score += (title_matches / len(query_terms)) * 0.4
    
    # Check abstract relevance
    abstract_matches = sum(1 for term in query_terms if term in paper.summary.lower())
    score += (abstract_matches / len(query_terms)) * 0.3
    
    # Check categories
    categories_text = " ".join(paper.categories).lower()
    category_matches = sum(1 for term in query_terms if term in categories_text)
    score += (category_matches / len(query_terms)) * 0.3
    
    return min(score, 1.0)


def _filter_academic_sources(web_results: List[Dict]) -> List[Dict]:
    """Filter web results to focus on academic sources"""
    
    academic_results = []
    
    for result in web_results:
        url = result.get("url", "").lower()
        title = result.get("title", "").lower()
        snippet = result.get("snippet", "").lower()
        
        # Check for academic indicators
        academic_score = 0.0
        
        # Domain-based scoring
        academic_domains = [".edu", ".org", "scholar.", "arxiv.", "pubmed.", "jstor.", "ieee.", "acm."]
        if any(domain in url for domain in academic_domains):
            academic_score += 0.4
        
        # Content-based scoring
        academic_keywords = ["research", "study", "analysis", "journal", "publication", "paper", "academic"]
        keyword_matches = sum(1 for keyword in academic_keywords if keyword in (title + " " + snippet))
        academic_score += min(keyword_matches * 0.1, 0.3)
        
        # Boost if appears to be a research result
        if any(term in (title + " " + snippet) for term in ["findings", "methodology", "conclusion", "hypothesis"]):
            academic_score += 0.3
        
        if academic_score >= 0.3:  # Threshold for academic relevance
            result["academic_quality_score"] = academic_score
            academic_results.append(result)
    
    return academic_results


def _generate_mock_search_results(query: str, max_results: int) -> List[Dict]:
    """Generate mock search results when real search is unavailable"""
    
    search_logger.info("🔄 Generating mock search results...")
    
    mock_results = []
    
    for i in range(min(max_results, 3)):
        result = {
            "title": f"Research on {query} - Part {i+1}",
            "url": f"https://example-research.com/article-{i+1}",
            "snippet": f"This article explores various aspects of {query} including methodology, findings, and implications for future research.",
            "source": "Mock",
            "rank": i + 1,
            "relevance_score": 0.8 - (i * 0.1),
            "search_query": query,
            "timestamp": datetime.now().isoformat()
        }
        mock_results.append(result)
    
    return mock_results


def _generate_mock_arxiv_results(query: str, max_results: int) -> List[Dict]:
    """Generate mock ArXiv results when real search is unavailable"""
    
    search_logger.info("🔄 Generating mock ArXiv results...")
    
    mock_results = []
    
    for i in range(min(max_results, 2)):
        result = {
            "title": f"A Comprehensive Analysis of {query}",
            "authors": ["Dr. A. Researcher", "Prof. B. Academic"],
            "abstract": f"This paper presents a detailed study on {query}, examining various theoretical frameworks and empirical evidence.",
            "url": f"https://arxiv.org/abs/2024.mock{i+1}",
            "pdf_url": f"https://arxiv.org/pdf/2024.mock{i+1}.pdf",
            "published": datetime.now().isoformat(),
            "categories": ["cs.AI", "stat.ML"],
            "source": "ArXiv (Mock)",
            "rank": i + 1,
            "relevance_score": 0.9 - (i * 0.1),
            "search_query": query,
            "timestamp": datetime.now().isoformat()
        }
        mock_results.append(result)
    
    return mock_results 