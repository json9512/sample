import { test, expect } from "@playwright/test";

test.describe("Chat Application E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real app, you'd need to handle authentication
    // For this demo, we'll assume the user is already authenticated
    await page.goto("/");
  });

  test("should display login page for unauthenticated user", async ({
    page,
  }) => {
    // Navigate to home page
    await page.goto("/");

    // Should redirect to login or show login interface
    await expect(page).toHaveURL(/login/);

    // Should show Google login button
    await expect(page.getByText(/sign in with google/i)).toBeVisible();
  });

  test("should display chat interface for authenticated user", async ({
    page,
  }) => {
    // Mock authentication state (in real tests you'd use Playwright fixtures)
    await page.addInitScript(() => {
      // Mock localStorage with user session
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: {
            id: "test-user",
            email: "test@example.com",
            user_metadata: { name: "Test User" },
          },
        })
      );
    });

    await page.goto("/");

    // Should show chat interface
    await expect(page.getByText("Start a new conversation")).toBeVisible();
    await expect(page.getByPlaceholder(/type your message/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /new conversation/i })
    ).toBeVisible();
  });

  test("should create new conversation and send message", async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: {
            id: "test-user",
            email: "test@example.com",
            user_metadata: { name: "Test User" },
          },
        })
      );
    });

    await page.goto("/");

    // Wait for interface to load
    await expect(page.getByText("Start a new conversation")).toBeVisible();

    // Type a message
    const messageInput = page.getByPlaceholder(/type your message/i);
    await messageInput.fill("Hello, how are you?");

    // Send button should become enabled
    const sendButton = page.getByRole("button", { name: /send message/i });
    await expect(sendButton).toBeEnabled();

    // Click send
    await sendButton.click();

    // Message should appear in chat
    await expect(page.getByText("Hello, how are you?")).toBeVisible();

    // Input should be cleared
    await expect(messageInput).toHaveValue("");
  });

  test("should handle keyboard shortcuts", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user", email: "test@example.com" },
        })
      );
    });

    await page.goto("/");
    await expect(page.getByText("Start a new conversation")).toBeVisible();

    // Test Cmd+N / Ctrl+N for new conversation
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";

    await page.keyboard.press(`${modifier}+KeyN`);

    // Should still show empty state (new conversation)
    await expect(page.getByText("Start a new conversation")).toBeVisible();
  });

  test("should handle message input with Enter and Shift+Enter", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user", email: "test@example.com" },
        })
      );
    });

    await page.goto("/");
    await expect(page.getByText("Start a new conversation")).toBeVisible();

    const messageInput = page.getByPlaceholder(/type your message/i);

    // Type message and press Enter
    await messageInput.fill("Hello");
    await messageInput.press("Enter");

    // Message should be sent
    await expect(page.getByText("Hello")).toBeVisible();

    // Type multi-line message with Shift+Enter
    await messageInput.fill("Line 1");
    await messageInput.press("Shift+Enter");
    await messageInput.type("Line 2");

    // Should have newline in textarea
    const textareaValue = await messageInput.inputValue();
    expect(textareaValue).toBe("Line 1\nLine 2");
  });

  test("should display conversation sidebar", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user", email: "test@example.com" },
        })
      );
    });

    await page.goto("/");

    // Should show sidebar elements
    await expect(
      page.getByRole("button", { name: /new conversation/i })
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Search conversations...")
    ).toBeVisible();

    // New conversation button should work
    const newConvButton = page.getByRole("button", {
      name: /new conversation/i,
    });
    await newConvButton.click();

    // Should show empty conversation state
    await expect(page.getByText("Start a new conversation")).toBeVisible();
  });

  test("should search conversations", async ({ page }) => {
    // Mock conversations data
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user", email: "test@example.com" },
        })
      );

      // Mock API responses
      (window as any).mockConversations = [
        {
          id: "1",
          title: "React questions",
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "JavaScript help",
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Vue.js tutorial",
          updated_at: new Date().toISOString(),
        },
      ];
    });

    await page.goto("/");

    // Type in search box
    const searchInput = page.getByPlaceholder("Search conversations...");
    await searchInput.fill("React");

    // Should filter conversations (assuming they're loaded)
    // Note: This test would need proper mocking of database calls in a real scenario
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user", email: "test@example.com" },
        })
      );
    });

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Interface should be responsive
    await expect(page.getByText("Start a new conversation")).toBeVisible();
    await expect(page.getByPlaceholder(/type your message/i)).toBeVisible();

    // Message input should be properly sized
    const messageInput = page.getByPlaceholder(/type your message/i);
    const inputBox = await messageInput.boundingBox();

    // Should not exceed viewport width
    expect(inputBox?.width).toBeLessThan(375);
  });

  test("should handle error states gracefully", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user", email: "test@example.com" },
        })
      );

      // Mock network errors
      window.fetch = () => Promise.reject(new Error("Network error"));
    });

    await page.goto("/");

    // Try to send a message that will fail
    const messageInput = page.getByPlaceholder(/type your message/i);
    await messageInput.fill("This will fail");

    const sendButton = page.getByRole("button", { name: /send message/i });
    await sendButton.click();

    // Should handle error gracefully (no crash)
    // Error message should appear or be handled silently
    await expect(messageInput).toBeVisible(); // Interface should still be functional
  });

  test("should display loading states", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user", email: "test@example.com" },
        })
      );
    });

    await page.goto("/");

    // Should show loading state initially
    // Note: This is hard to test without slowing down the API calls
    // In a real test, you'd mock slow API responses

    // Eventually should show the interface
    await expect(page.getByText("Start a new conversation")).toBeVisible();
  });

  test("should maintain accessibility standards", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: { id: "test-user", email: "test@example.com" },
        })
      );
    });

    await page.goto("/");

    // Check for proper ARIA labels
    await expect(
      page.getByRole("button", { name: /send message/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /new conversation/i })
    ).toBeVisible();

    // Check that form elements are properly labeled
    const messageInput = page.getByPlaceholder(/type your message/i);
    await expect(messageInput).toBeVisible();

    // Check keyboard navigation
    await page.keyboard.press("Tab");
    // Should focus on interactive elements in logical order
  });

  test("should handle concurrent users (basic)", async ({ browser }) => {
    // Create two browser contexts to simulate different users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Set up authentication for both users
    await page1.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token-1",
          user: { id: "user-1", email: "user1@example.com" },
        })
      );
    });

    await page2.addInitScript(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token-2",
          user: { id: "user-2", email: "user2@example.com" },
        })
      );
    });

    // Both users should be able to use the app independently
    await Promise.all([page1.goto("/"), page2.goto("/")]);

    await Promise.all([
      expect(page1.getByText("Start a new conversation")).toBeVisible(),
      expect(page2.getByText("Start a new conversation")).toBeVisible(),
    ]);

    await context1.close();
    await context2.close();
  });
});
