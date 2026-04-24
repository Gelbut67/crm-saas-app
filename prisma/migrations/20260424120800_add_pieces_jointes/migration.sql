-- CreateTable
CREATE TABLE "pieces_jointes" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "urlFichier" TEXT NOT NULL,
    "typeFichier" TEXT,
    "tailleFichier" INTEGER,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pieces_jointes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pieces_jointes" ADD CONSTRAINT "pieces_jointes_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
