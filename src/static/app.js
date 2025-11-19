document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset select options (keep default)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic info + placeholder for participants list
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list safely using textContent
        const ul = activityCard.querySelector(".participants-list");
        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((participant) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.className = "participant-item";
            span.textContent = participant;

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.title = "Unregister participant";
            deleteBtn.innerHTML = "&times;";

            // Unregister handler
            deleteBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              // Call DELETE endpoint
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );

                if (resp.ok) {
                  // Remove the li from DOM
                  li.remove();

                  // If list is empty now, show placeholder
                  if (ul.querySelectorAll("li").length === 0) {
                    const placeholder = document.createElement("li");
                    placeholder.textContent = "No participants yet";
                    placeholder.className = "no-participants";
                    ul.appendChild(placeholder);
                  }

                  // Update availability text
                  const avail = activityCard.querySelector(".availability");
                  if (avail) {
                    // Parse current number and increment by 1
                    const match = avail.textContent.match(/(\\d+) spots left/);
                    if (match) {
                      const current = parseInt(match[1], 10);
                      avail.innerHTML = `<strong>Availability:</strong> ${current + 1} spots left`;
                    }
                  }
                } else {
                  const data = await resp.json().catch(() => ({}));
                  alert(data.detail || "Failed to unregister participant");
                }
              } catch (err) {
                console.error("Error unregistering:", err);
                alert("Failed to unregister participant. Please try again.");
              }
            });

            li.appendChild(span);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          li.className = "no-participants";
          ul.appendChild(li);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities so the new participant shows up immediately
        // (re-fetch updated activity data from the server)
        try {
          await fetchActivities();
        } catch (err) {
          console.error("Error refreshing activities after signup:", err);
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
