import { pipeline } from "@xenova/transformers";

const run = async () => {
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );
  const out = await embedder("hello world");

  let arr: any;
  if (out?.data) arr = out.data;
  else if (Array.isArray(out)) arr = out;
  else {
    console.error("Unknown output format:", out);
    return;
  }

  console.log("Type:", typeof arr);
  console.log("Is array:", Array.isArray(arr));
  console.log("Length:", arr.length);

  console.log("Sample:", arr.slice(0, 10));
};

run();
