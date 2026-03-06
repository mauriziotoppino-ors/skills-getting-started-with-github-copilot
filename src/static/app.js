document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // disable cache to ensure we always get the latest data
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and reset select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants list markup with delete button
      let participantsMarkup = "<p><strong>Participants:</strong></p>";
      if (details.participants.length > 0) {
        participantsMarkup += "<ul class=\"participants-list\">";
        details.participants.forEach((p) => {
          participantsMarkup += `<li>${p} <span class=\"delete-participant\" data-activity=\"${name}\" data-email=\"${p}\">✖️</span></li>`;
        });
        participantsMarkup += "</ul>";
      } else {
        participantsMarkup += "<p class=\"info\">No participants yet</p>";
      }

      activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        // wire up delete icons for this activity
        activityCard.querySelectorAll(".delete-participant").forEach((icon) => {
          icon.addEventListener("click", async () => {
            const email = icon.dataset.email;
            const activityName = icon.dataset.activity;
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const resJson = await resp.json();
              if (resp.ok) {
                messageDiv.textContent = resJson.message;
                messageDiv.className = "success";
                await fetchActivities();
              } else {
                messageDiv.textContent = resJson.detail || "Error unregistering";
                messageDiv.className = "error";
              }
              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
            } catch (err) {
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering:", err);
            }
          });
        });

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
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities list to show updated participants and availability
        await fetchActivities();
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
