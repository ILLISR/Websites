import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
import json
import logging
import time

# Configurar el logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def search_hash_on_virustotal():
    options = uc.ChromeOptions()
    options.binary_location = "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe"  # Actualiza la ruta a tu ejecutable de Brave
    options.add_argument("--auto-open-devtools-for-tabs")  # Abrir las herramientas de desarrollo automáticamente
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3")

    # Usar undetected-chromedriver para evitar la detección
    driver = uc.Chrome(options=options)

    # Modificar propiedades de webdriver en la sesión para evitar detección
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    try:
        logging.info("Navegando a la página principal de VirusTotal.")
        driver.get("https://www.virustotal.com/gui/home/search")

        # Simular comportamiento humano
        time.sleep(3)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)

        # Esperar a que la página se cargue completamente
        time.sleep(10)

        # Capturar todos los elementos de entrada y sus atributos
        elements_info = []

        # Capturar todos los elementos input
        inputs = driver.find_elements(By.TAG_NAME, "input")
        textareas = driver.find_elements(By.TAG_NAME, "textarea")
        buttons = driver.find_elements(By.TAG_NAME, "button")

        for element in inputs + textareas + buttons:
            element_info = {
                "tag_name": element.tag_name,
                "id": element.get_attribute("id"),
                "class": element.get_attribute("class"),
                "name": element.get_attribute("name"),
                "placeholder": element.get_attribute("placeholder"),
                "aria-label": element.get_attribute("aria-label"),
                "type": element.get_attribute("type"),
                "value": element.get_attribute("value")
            }
            elements_info.append(element_info)

        # Guardar la información de los elementos en un archivo
        with open("elements_info.json", "w", encoding="utf-8") as f:
            json.dump(elements_info, f, ensure_ascii=False, indent=4)

        logging.info(f"Captured {len(elements_info)} elements. Details saved to 'elements_info.json'.")

    except Exception as e:
        logging.error(f"An error occurred: {e}")
        with open("error_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)

    finally:
        driver.quit()

if __name__ == "__main__":
    search_hash_on_virustotal()
