'use client';

/**
 * PDF Exporter utility for Dark Dawn characters
 * Uses pdfMake library to generate PDF documents
 */

/**
 * Export Dark Dawn character to PDF
 * @param {Object} ddCharacter - Dark Dawn character object
 * @returns {Promise<void>}
 */
export async function exportDarkDawnToPDF(ddCharacter) {
  if (!ddCharacter.Race) {
    alert('Please generate a character first');
    return;
  }

  try {
    // Dynamically import pdfMake only when needed (client-side only)
    // Following official documentation: https://pdfmake.github.io/docs/0.1/getting-started/client-side/
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;

    // Use official method to add virtual file system
    pdfMake.addVirtualFileSystem(pdfFonts);

    const characterName = ddCharacter.Name || 'Character';

    const docDefinition = {
      content: [
        { text: characterName, fontSize: 20, alignment: 'center', margin: [0, 0, 0, 10], bold: true, style: 'header' },
        { text: `Race: ${ddCharacter.Race?.name || ''}`, margin: [0, 5, 0, 0] },
        { text: `Race Description: ${ddCharacter.Race?.description || ''}`, margin: [0, 5, 0, 0] },
        { text: `Class: ${ddCharacter.Class?.name || ''}`, margin: [0, 5, 0, 0] },
        { text: `Faction: ${ddCharacter.Faction?.name || ''}`, margin: [0, 5, 0, 0] },
        { text: `Deity: ${ddCharacter.Deity?.name || ''}`, margin: [0, 5, 0, 0] },
        { text: `Special Ability: ${ddCharacter.SpecialAbility?.name || ''}`, margin: [0, 5, 0, 0] },
        { text: `Faction Ability: ${ddCharacter.FactionAbility?.name || ''}`, margin: [0, 5, 0, 0] }
      ],
    };

    // pdfMake.createPdf(docDefinition).open(`${characterName.replace(/\s/g, '_')}_darkdawn.pdf`);
    pdfMake.createPdf(docDefinition).open();
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
}
