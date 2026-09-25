const { mdToPdf } = require('md-to-pdf');
const fs = require('fs');

(async () => {
    try {
        console.log("Starting PDF generation...");
        const pdf = await mdToPdf({ path: 'TrailGuard_Project_Summary.md' }).catch(err => {
            console.error("mdToPdf error:", err);
        });
        if (pdf) {
            fs.writeFileSync('TrailGuard_Project_Summary.pdf', pdf.content);
            console.log('PDF generated successfully.');
        } else {
            console.log('PDF generation returned empty.');
        }
    } catch(err) {
        console.error("Script error:", err);
    }
})();
