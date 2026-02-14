<?php

require __DIR__.'/vendor/autoload.php';

use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\CSV\Writer;

$filePath = __DIR__.'/large_test_300k.csv';
$writer = new Writer;
$writer->openToFile($filePath);

// Header
$header = Row::fromValues(['Name', 'Email', 'Address', 'Phone', 'Date joined', 'Score']);
$writer->addRow($header);

echo "Generating 300,000 rows...\n";

for ($i = 0; $i < 300000; $i++) {
    $row = Row::fromValues([
        "User $i",
        "user$i@example.com",
        "Address Line $i, City, Country",
        "555-000-$i",
        date('Y-m-d H:i:s'),
        rand(1, 100),
    ]);
    $writer->addRow($row);

    if ($i % 10000 == 0) {
        echo "Generated $i rows...\n";
    }
}

$writer->close();

echo "Done! File saved to $filePath\n";
