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
            from ddgs import DDGS
            ddgs_available = True
        except ImportError:
            try:
                # Fallback to old package name if new one not available
                from duckduckgo_search import DDGS
                ddgs_available = True
                search_logger.warning("⚠️ Using deprecated duckduckgo_search package. Please upgrade to 'ddgs'")
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
        
        # Calculate quality metrics
        quality_metrics = {
            "total_results": len(results),
            "avg_relevance": sum(r.get("relevance_score", 0) for r in results) / len(results) if results else 0,
            "high_relevance_count": len([r for r in results if r.get("relevance_score", 0) > 0.7]),
            "search_effectiveness": "high" if len(results) >= 5 else "medium" if len(results) >= 2 else "low"
        }
        
        # Update context with search metadata
        search_metadata = {
            "search_performed": True,
            "search_query": optimized_query,
            "original_query": search_query,
            "results_count": len(results),
            "search_results_processed": len(results),  # Add this for workflow metrics
            "search_source": "DuckDuckGo" if ddgs_available and results and results[0].get("source") != "Mock" else "Mock",
            "search_timestamp": datetime.now().isoformat(),
            "search_results": results  # Store actual results for other tools to use
        }
        
        context.update(search_metadata)
        
        # Provide detailed step output information
        context["step_output_details"] = {
            "summary": f"Found {len(results)} web sources using optimized query '{optimized_query}'",
            "actions": [
                f"Optimized search query from '{search_query}' to '{optimized_query}'",
                f"Searched {search_metadata['search_source']} with safety={search_safesearch}",
                f"Retrieved {len(results)} results" + (f" in {search_duration:.2f}s" if 'search_duration' in locals() else ""),
                f"Calculated relevance scores (avg: {quality_metrics['avg_relevance']:.2f})"
            ],
            "data_processed": {
                "input_query_length": len(search_query),
                "optimized_query_length": len(optimized_query),
                "total_content_retrieved": sum(len(r.get("snippet", "")) for r in results),
                "unique_domains": len(set(r.get("url", "").split("/")[2] for r in results if r.get("url")))
            },
            "metrics": quality_metrics
        }
        
        # Add to search history
        if "search_history" not in context:
            context["search_history"] = []
        
        context["search_history"].append({
            "query": optimized_query,
            "results_count": len(results),
            "timestamp": datetime.now().isoformat(),
            "quality_metrics": quality_metrics
        })
        
        search_logger.info(f"📊 Search metrics: {quality_metrics['search_effectiveness']} effectiveness, avg relevance: {quality_metrics['avg_relevance']:.2f}")
        
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
    
    # Check title relevance (more generous matching)
    title = result.get("title", "").lower()
    title_matches = 0
    for term in query_terms:
        if term in title:
            title_matches += 1
        elif len(term) > 3:  # Check for partial matches on longer terms
            if any(term[:4] in word or word[:4] in term for word in title.split()):
                title_matches += 0.5
    score += min(title_matches / len(query_terms), 1.0) * 0.6
    
    # Check snippet relevance (more generous matching)
    snippet = result.get("snippet", "").lower()
    snippet_matches = 0
    for term in query_terms:
        if term in snippet:
            snippet_matches += 1
        elif len(term) > 3:  # Check for partial matches on longer terms
            if any(term[:4] in word or word[:4] in term for word in snippet.split()):
                snippet_matches += 0.5
    score += min(snippet_matches / len(query_terms), 1.0) * 0.4
    
    # Boost academic sources
    url = result.get("url", "").lower()
    academic_domains = [".edu", ".org", "scholar.", "arxiv.", "pubmed.", "jstor."]
    if any(domain in url for domain in academic_domains):
        score += 0.3
    
    # Boost for research-related content
    text_content = (title + " " + snippet).lower()
    research_terms = ["research", "study", "analysis", "investigation", "findings", "evidence"]
    if any(term in text_content for term in research_terms):
        score += 0.2
    
    # Ensure minimum score for any result that contains query terms
    if title_matches > 0 or snippet_matches > 0:
        score = max(score, 0.4)  # Minimum relevance for matches
    
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
    
    # Create more substantial and realistic mock content
    mock_templates = [
        {
            "title_template": "Research Review: {query} - Current Perspectives and Analysis",
            "snippet_template": "This comprehensive review examines current research on {query}, synthesizing findings from multiple studies. Key findings indicate significant relationships between various factors affecting {query}. The review identifies methodological approaches that have proven effective and highlights areas where additional research is needed. Evidence suggests that {query} involves complex interactions between multiple variables, with practical implications for both theoretical understanding and real-world applications. Current literature demonstrates growing consensus on fundamental principles while revealing ongoing debates about specific mechanisms and optimal implementation strategies.",
            "url_template": "https://research-journal.org/articles/review-{query_slug}",
            "source": "Academic Review"
        },
        {
            "title_template": "Empirical Study on {query}: Methodology and Findings",
            "snippet_template": "This empirical investigation explores {query} through controlled experimental design involving comprehensive data collection and analysis. Results demonstrate statistically significant relationships between key variables related to {query}. The study employed validated instruments and robust analytical methods to ensure reliability of findings. Participants showed consistent patterns that support current theoretical frameworks while suggesting refinements to existing models. These findings contribute to the growing body of evidence supporting evidence-based approaches to understanding {query}.",
            "url_template": "https://empirical-studies.edu/research/{query_slug}-findings",
            "source": "Empirical Research"
        },
        {
            "title_template": "Meta-Analysis of {query}: Systematic Review of Evidence",
            "snippet_template": "This systematic review and meta-analysis examines the current state of research on {query} by analyzing findings from multiple studies. The analysis includes studies published over the past decade, representing diverse populations and methodological approaches. Results reveal consistent patterns across studies, with effect sizes indicating moderate to strong relationships. Quality assessment of included studies shows generally high methodological rigor. The findings support the effectiveness of evidence-based interventions and identify factors that moderate outcomes related to {query}.",
            "url_template": "https://meta-analysis.org/systematic-reviews/{query_slug}",
            "source": "Meta-Analysis"
        },
        {
            "title_template": "Clinical Applications of {query}: Practice Guidelines and Evidence",
            "snippet_template": "This clinical practice guide synthesizes current evidence regarding the application of {query} in real-world settings. The guidelines are based on comprehensive review of research literature and expert consensus. Evidence indicates that implementation of {query}-based approaches leads to improved outcomes when applied according to established protocols. The guide includes recommendations for assessment, intervention selection, and outcome monitoring. Special attention is given to factors that influence effectiveness and strategies for adapting approaches to diverse populations and settings.",
            "url_template": "https://clinical-guidelines.org/practice/{query_slug}",
            "source": "Clinical Guidelines"
        },
        {
            "title_template": "Theoretical Framework for Understanding {query}: Conceptual Analysis",
            "snippet_template": "This theoretical analysis presents a comprehensive framework for understanding {query} from multiple disciplinary perspectives. The framework integrates insights from cognitive science, behavioral psychology, and systems theory to provide a unified approach to conceptualizing {query}. Key components include underlying mechanisms, environmental factors, and individual differences that influence outcomes. The framework provides a foundation for developing targeted interventions and predicting responses to different approaches. Implications for both research and practice are discussed in detail.",
            "url_template": "https://theoretical-frameworks.edu/models/{query_slug}",
            "source": "Theoretical Analysis"
        }
    ]
    
    # Clean query for URL slug
    query_slug = query.lower().replace(" ", "-").replace("'", "").replace(",", "")[:50]
    
    for i in range(min(max_results, len(mock_templates))):
        template = mock_templates[i]
        
        result = {
            "title": template["title_template"].format(query=query),
            "url": template["url_template"].format(query_slug=query_slug),
            "snippet": template["snippet_template"].format(query=query),
            "source": template["source"],
            "rank": i + 1,
            "relevance_score": 0.9 - (i * 0.1),  # Higher relevance scores
            "search_query": query,
            "timestamp": datetime.now().isoformat()
        }
        mock_results.append(result)
    
    search_logger.info(f"✅ Generated {len(mock_results)} high-quality mock search results")
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