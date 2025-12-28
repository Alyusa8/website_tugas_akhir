import torch

print("PyTorch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("CUDA version:", torch.version.cuda)
    print("GPU device:", torch.cuda.get_device_name(0))
    print("Number of GPUs:", torch.cuda.device_count())
else:
    print("CUDA is NOT available. You are using CPU version of PyTorch.")
    print("To use GPU, install PyTorch with CUDA support:")
    print("pip uninstall torch torchvision torchaudio")
    print("pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")
