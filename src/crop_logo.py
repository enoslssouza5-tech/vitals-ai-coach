from PIL import Image, ImageOps
import os

def crop_and_clean_logo():
    # Caminho da imagem de entrada fornecida pelo Gemini
    input_path = r"C:\Users\enosl\.gemini\antigravity\brain\79ea0441-2319-4ad3-8528-90f216ab3de2\media__1779416023523.jpg"
    output_path = r"c:\Users\enosl\Desktop\Pulse\vitals-ai-coach\public\images\logo.png"

    if not os.path.exists(input_path):
        print(f"Erro: Arquivo {input_path} não encontrado.")
        return

    # Abrir imagem e converter para RGBA
    img = Image.open(input_path).convert("RGBA")
    
    # Processar pixels para deixar apenas os tons escuros (logo) pretos e o fundo branco transparente
    datas = img.getdata()
    newData = []
    
    for item in datas:
        # Se for um pixel predominantemente escuro (logo), mantemos preto com canal alfa cheio
        if item[0] < 220 and item[1] < 220 and item[2] < 220:
            newData.append((0, 0, 0, 255))
        else:
            # Fundo branco fica 100% transparente
            newData.append((0, 0, 0, 0))
            
    img.putdata(newData)
    
    # Obter bounding box da área transparente (alpha > 0)
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    
    if bbox:
        # Fazer o corte justo
        cropped = img.crop(bbox)
        
        # Adicionar padding de 20px ao redor para melhor visualização
        padding = 20
        w, h = cropped.size
        final_img = Image.new("RGBA", (w + padding * 2, h + padding * 2), (0, 0, 0, 0))
        final_img.paste(cropped, (padding, padding))
        
        # Garantir pasta de destino existe
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Salvar a nova logo limpa e transparente
        final_img.save(output_path, "PNG")
        print(f"Sucesso: Logo salva em {output_path}!")
    else:
        print("Erro: Não foi possível detectar o bounding box da logo.")

if __name__ == "__main__":
    crop_and_clean_logo()
