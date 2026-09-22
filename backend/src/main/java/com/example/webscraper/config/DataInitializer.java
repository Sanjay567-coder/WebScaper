package com.example.webscraper.config;

import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.entity.User;
import com.example.webscraper.entity.enums.TaskStatus;
import com.example.webscraper.entity.enums.UserRole;
import com.example.webscraper.repository.ScrapingTaskRepository;
import com.example.webscraper.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ScrapingTaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Ensure default Admin user exists and has a verified encoded password
        Optional<User> existingAdmin = userRepository.findByEmail("admin@webscraper.local");
        if (existingAdmin.isEmpty()) {
            log.info("Creating default Administrator user...");
            User admin = User.builder()
                    .name("System Administrator")
                    .email("admin@webscraper.local")
                    .passwordHash(passwordEncoder.encode("Admin@123"))
                    .role(UserRole.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created: admin@webscraper.local / Admin@123");
        } else {
            User admin = existingAdmin.get();
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            userRepository.save(admin);
            log.info("Default admin user password synchronized: admin@webscraper.local / Admin@123");
        }

        // Seed default Sample Scraping Tasks if none exists
        if (taskRepository.count() == 0) {
            log.info("Seeding initial public scraping tasks...");

            String booksConfig = """
                {
                  "itemContainerSelector": "article.product_pod",
                  "fields": [
                    { "name": "title", "selector": "h3 a", "attribute": "title", "type": "TEXT" },
                    { "name": "price", "selector": ".price_color", "attribute": "text", "type": "TEXT" },
                    { "name": "availability", "selector": ".availability", "attribute": "text", "type": "TEXT" },
                    { "name": "rating", "selector": "p.star-rating", "attribute": "class", "type": "TEXT" },
                    { "name": "detailUrl", "selector": "h3 a", "attribute": "href", "type": "URL" },
                    { "name": "thumbnailUrl", "selector": ".image_container img", "attribute": "src", "type": "URL" }
                  ]
                }
                """.trim();

            ScrapingTask booksTask = ScrapingTask.builder()
                    .name("Books to Scrape - Catalogue Explorer")
                    .sourceUrl("https://books.toscrape.com/catalogue/category/books_1/index.html")
                    .extractionConfig(booksConfig)
                    .schedule("0 0 * * * *")
                    .status(TaskStatus.ACTIVE)
                    .timeoutSeconds(10)
                    .retryCount(2)
                    .build();
            taskRepository.save(booksTask);

            String quotesConfig = """
                {
                  "itemContainerSelector": "div.quote",
                  "fields": [
                    { "name": "quote", "selector": "span.text", "attribute": "text", "type": "TEXT" },
                    { "name": "author", "selector": "small.author", "attribute": "text", "type": "TEXT" },
                    { "name": "authorUrl", "selector": "span a", "attribute": "href", "type": "URL" },
                    { "name": "tags", "selector": "div.tags a.tag", "attribute": "text", "type": "ARRAY" }
                  ]
                }
                """.trim();

            ScrapingTask quotesTask = ScrapingTask.builder()
                    .name("Quotes to Scrape - Quotes Collector")
                    .sourceUrl("https://quotes.toscrape.com/")
                    .extractionConfig(quotesConfig)
                    .schedule("0 0 12 * * *")
                    .status(TaskStatus.ACTIVE)
                    .timeoutSeconds(10)
                    .retryCount(2)
                    .build();
            taskRepository.save(quotesTask);

            log.info("Sample scraping tasks seeded successfully.");
        }
    }
}
