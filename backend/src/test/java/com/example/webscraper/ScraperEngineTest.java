package com.example.webscraper;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import com.example.webscraper.dto.config.ExtractionFieldDto;
import com.example.webscraper.service.scraper.ScraperEngineService;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class ScraperEngineTest {

    private final ScraperEngineService scraperEngineService = new ScraperEngineService();

    @Test
    @DisplayName("Should extract multiple container items with selectors and attributes")
    void testExtractDataFromDocument() {
        String html = """
            <html>
                <body>
                    <div class="products-grid">
                        <article class="product">
                            <h3><a href="/books/1" title="The Great Gatsby">The Great Gatsby</a></h3>
                            <span class="price">$19.99</span>
                            <span class="tag">Fiction</span>
                            <span class="tag">Classic</span>
                        </article>
                        <article class="product">
                            <h3><a href="/books/2" title="1984">1984</a></h3>
                            <span class="price">$14.50</span>
                            <span class="tag">Dystopian</span>
                        </article>
                    </div>
                </body>
            </html>
            """;

        Document doc = Jsoup.parse(html, "https://example.com");

        ExtractionConfigDto config = ExtractionConfigDto.builder()
                .itemContainerSelector("article.product")
                .fields(List.of(
                        ExtractionFieldDto.builder().name("title").selector("h3 a").attribute("title").type("TEXT").build(),
                        ExtractionFieldDto.builder().name("price").selector("span.price").attribute("text").type("NUMBER").build(),
                        ExtractionFieldDto.builder().name("link").selector("h3 a").attribute("href").type("URL").build(),
                        ExtractionFieldDto.builder().name("tags").selector("span.tag").attribute("text").type("ARRAY").build()
                ))
                .build();

        List<Map<String, Object>> results = scraperEngineService.extractDataFromDocument(doc, config);

        assertNotNull(results);
        assertEquals(2, results.size());

        Map<String, Object> item1 = results.get(0);
        assertEquals("The Great Gatsby", item1.get("title"));
        assertEquals(19.99, (Double) item1.get("price"), 0.001);
        assertEquals("https://example.com/books/1", item1.get("link"));
        assertTrue(item1.get("tags") instanceof List);
        assertEquals(List.of("Fiction", "Classic"), item1.get("tags"));

        Map<String, Object> item2 = results.get(1);
        assertEquals("1984", item2.get("title"));
        assertEquals(14.50, (Double) item2.get("price"), 0.001);
    }
}
