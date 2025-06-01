$(document).ready(function () {
    let studentsList;

    // Fetch student data from the local JSON file on page load
    $.getJSON("./students.json", function (data) {
        studentsList = data.Students;

        // Initialize DataTable with student data
        const table = new DataTable("#crud", {
            data: studentsList,
            processing: true,
            scrollX: true,         // Enables horizontal scrolling
            stateSave: true,       // Saves table state (pagination, sorting, etc.)
            columns: [
                { data: "Identity" },
                { data: "Name" },
                { data: "Surname" },
                { data: "Birthday" },
                {
                    // Calculate and display age based on birthday
                    data: null,
                    render: function (data) {
                        const [year, month, day] = data.Birthday.split("-").map(Number);
                        const today = new Date();
                        let age = today.getFullYear() - year;
                        if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
                            age--;
                        }
                        return age;
                    },
                },
                { data: "Gender" },
                {
                    // Action buttons for inline edit, save, modal edit, and delete
                    data: null,
                    defaultContent: `
                        <div class="inline-buttons">
                            <button type="button" class="btn btn-dark btn-sm inline-edit-button" title="Inline Edit">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button type="button" class="btn btn-success btn-sm save-button d-none" title="Save">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            <button type="button" class="btn btn-dark btn-sm modal-edit-button" title="Modal Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm delete-button" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`
                },
            ],
            columnDefs: [
                {
                    targets: 3, // Format the Birthday column using default date rendering
                    render: DataTable.render.date()
                }
            ]
        });

        // -------------------- DOWNLOAD JSON --------------------
        $("#download-json-button").click(function () {
            // Prevent download if no data
            if (!studentsList || studentsList.length === 0) {
                return alert("No data to download!");
            }

            // Convert data to JSON string and create a downloadable file
            const jsonStr = JSON.stringify({ Students: studentsList }, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "students.json";
            document.body.appendChild(link);
            link.click(); // Trigger download
            document.body.removeChild(link);
        });

        // -------------------- UPLOAD JSON --------------------
        $("#upload-json-button").on("click", function () {
            // Trigger file input click
            $("#upload-json-file").click();
        });

        $("#upload-json-file").on("change", function () {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();

            // Read uploaded file as text
            reader.onload = function (e) {
                try {
                    const json = JSON.parse(e.target.result);

                    // Validate and replace student data
                    if (!json.Students) {
                        return alert("Invalid JSON: Missing 'Students' array.");
                    }

                    studentsList = json.Students;
                    table.clear(); // Clear old data
                    table.rows.add(studentsList).draw(); // Load new data
                } catch (err) {
                    alert("Failed to parse JSON: " + err.message);
                }
            };

            reader.readAsText(file);
            $(this).val(""); // Clear file input for future uploads
        });

        // -------------------- ADD NEW STUDENT --------------------
        $("#new-record-button").on("click", function () {
            $("#add-modal").modal("show");

            // Save new record on modal save button click
            $("#add-save-button").off("click").on("click", function () {
                const newData = {
                    Identity: $("#add-identity").val(),
                    Name: $("#add-name").val(),
                    Surname: $("#add-surname").val(),
                    Birthday: $("#add-birthday").val(),
                    Gender: $("#add-gender").val()
                };

                // Add new record to DataTable and studentsList
                table.row.add(newData).draw();
                studentsList.push(newData);
                $("#add-modal").modal("hide");
            });
        });

        // -------------------- INLINE EDIT --------------------
        $("#crud tbody").on("click", ".inline-edit-button", function () {
            const row = $(this).closest("tr");
            const rowData = table.row(row).data();

            // Show save button and hide inline edit button
            row.find(".inline-edit-button").hide();
            row.find(".save-button").removeClass("d-none");

            // Replace cells with input fields for editing
            row.find("td:eq(0)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Identity}">`);
            row.find("td:eq(1)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Name}">`);
            row.find("td:eq(2)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Surname}">`);
            row.find("td:eq(3)").html(`<input class="form-control form-control-sm" type="date" value="${rowData.Birthday}">`);
            row.find("td:eq(5)").html(`<input class="form-control form-control-sm" type="text" value="${rowData.Gender}">`);
        });

        // -------------------- INLINE SAVE --------------------
        $("#crud tbody").on("click", ".save-button", function () {
            const row = $(this).closest("tr");

            // Gather updated values from input fields
            const updatedData = {
                Identity: row.find("td:eq(0) input").val(),
                Name: row.find("td:eq(1) input").val(),
                Surname: row.find("td:eq(2) input").val(),
                Birthday: row.find("td:eq(3) input").val(),
                Gender: row.find("td:eq(5) input").val()
            };

            const rowIndex = table.row(row).index();

            // Update DataTable and studentsList
            table.row(rowIndex).data(updatedData).draw();
            const idx = studentsList.findIndex(s => s.Identity === updatedData.Identity);
            if (idx > -1) studentsList[idx] = updatedData;
        });

        // -------------------- MODAL EDIT --------------------
        $("#crud").on("click", ".modal-edit-button", function () {
            const row = $(this).closest("tr");
            const rowData = table.row(row).data();

            // Populate modal fields with current row data
            $("#identity").val(rowData.Identity);
            $("#name").val(rowData.Name);
            $("#surname").val(rowData.Surname);
            $("#birthday").val(rowData.Birthday);
            $("#gender").val(rowData.Gender);

            $("#edit-modal").modal("show");

            // Save changes on modal save button click
            $("#edit-save-button").off("click").on("click", function () {
                const updatedData = {
                    Identity: $("#identity").val(),
                    Name: $("#name").val(),
                    Surname: $("#surname").val(),
                    Birthday: $("#birthday").val(),
                    Gender: $("#gender").val()
                };

                const rowIndex = table.row(row).index();

                // Update DataTable and studentsList
                table.row(rowIndex).data(updatedData).draw();
                const idx = studentsList.findIndex(s => s.Identity === updatedData.Identity);
                if (idx > -1) studentsList[idx] = updatedData;

                $("#edit-modal").modal("hide");
            });
        });

        // -------------------- DELETE STUDENT --------------------
        $("#crud tbody").on("click", ".delete-button", function () {
            const row = $(this).closest("tr");
            const rowData = table.row(row).data();

            // Confirm before deleting
            if (confirm(`Delete record for ${rowData.Identity}?`)) {
                table.row(row).remove().draw();
                studentsList = studentsList.filter(r => r.Identity !== rowData.Identity);
            }
        });
    });
});