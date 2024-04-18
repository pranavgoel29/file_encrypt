import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import fs, { readdir } from "fs/promises";
import path from "path";
import { exec } from "child_process";

export async function GET(req: NextRequest) {
  const directoryPath = path.join(process.cwd(), "../var/tpm/tmp");
  const execdirectoryPath = path.join(process.cwd(), "../var/tpm/uploads");
  const execfiles = await fs.readdir(execdirectoryPath);
  try {
    // Define the directory path

    if (execfiles.length > 0) {
      exec(
        `tpm2_encryptdecrypt -d -c ../var/tpm/key.ctx -o ../var/tpm/tmp/${execfiles[0]} ../var/tpm/uploads/${execfiles[0]} && \
         tpm2_flushcontext -tls`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stderr: ${stderr}`);
          console.log(`stdout: ${stdout}`);
        }
      );
    } else if (execfiles.length === 0) {
      exec(
        `tpm2_flushcontext -tls && \
       tpm2_createprimary -Gecc256 -c ../var/tpm/primary.ctx && \
       tpm2_flushcontext -tls && \
       tpm2_create -C ../var/tpm/primary.ctx -Gaes128 -c ../var/tpm/key.ctx && \
       tpm2_flushcontext -tls && \
       rm ../var/tpm/primary.ctx && \
       tpm2_encryptdecrypt -c ../var/tpm/key.ctx -o ../root/flag.txt.enc ../root/flag.txt && \
       rm ../root/flag.txt && \
       tpm2_flushcontext -tls`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stderr: ${stderr}`);
          console.log(`stdout: ${stdout}`);
        }
      );
    }

    // Read the files in the directory
    const files = await fs.readdir(directoryPath);

    // Check if there are any files
    if (files.length === 0) {
      return NextResponse.json("No files found", { status: 404 });
    }

    // Get the first file in the array
    const firstFile = files[0];

    // Construct the file path
    const filePath = path.join(directoryPath, firstFile);

    // Read the file content
    const fileContent = await fs.readFile(filePath);

    // Set headers for file download
    const headers = {
      "Content-Disposition": `attachment; filename="${firstFile}"`,
      "Content-Type": "application/octet-stream",
      "X-FileName": firstFile,
      "X-fileSize": `${fileContent.byteLength}`,
    };

    // Return the file content as response
    return new NextResponse(fileContent, { headers });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  } finally {
    if (execfiles.length > 0) {
      exec(`rm ../var/tpm/tmp/${execfiles[0]}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
        }
        console.log(`stderr: ${stderr}`);
        console.log(`stdout: ${stdout}`);
      });
    }
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const f = formData.get("file");

  if (!f) {
    return NextResponse.json({}, { status: 400 });
  }
  const file = f as File;
  const destinationDirPath = path.join(process.cwd(), "../var/tpm/tmp");
  try {
    // Read the files in the destination directory
    const files = await readdir(destinationDirPath);

    // Check if there are any files present
    if (files.length > 0) {
      return NextResponse.json("File already exists", { status: 500 }); // Remove the argument from the function call
    }
    const fileArrayBuffer = await file.arrayBuffer();
    if (!existsSync(destinationDirPath)) {
      fs.mkdir(destinationDirPath, { recursive: true });
    }
    await fs.writeFile(
      path.join(destinationDirPath, file.name),
      Buffer.from(fileArrayBuffer)
    );

    console.log(destinationDirPath);
    exec(
      `tpm2_flushcontext -tls && \
       tpm2_encryptdecrypt -c ../var/tpm/key.ctx -o ../var/tpm/uploads/${file.name} ../var/tpm/tmp/${file.name} && \ 
       tpm2_flushcontext -tls && \
       rm ../var/tpm/tmp/${file.name}
       `,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stderr: ${stderr}`);
        console.log(`stdout: ${stdout}`);
      }
    );

    return NextResponse.json({
      fileName: file.name,
      size: file.size,
      lastModified: new Date(file.lastModified),
    });
  } catch (error) {
    console.error("Error checking files in upload directory:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get the file name from the request body
    const fileName = await req.json(); // Assuming fileName is passed in the request body
    // Construct the file path
    const filePath = path.join(process.cwd(), "../var/tpm/uploads", fileName);
    const directoryPath = path.join(process.cwd(), "../var/tpm/tmp", fileName);

    try {
      // Check if the file exists
      await fs.access(filePath);
      // Delete the file
      await fs.unlink(filePath);
      await fs.access(directoryPath);
      await fs.unlink(directoryPath);

      return NextResponse.json("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      return NextResponse.json("Internal Server Error", { status: 500 });
    }
    return NextResponse.json("File deleted successfully");
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
