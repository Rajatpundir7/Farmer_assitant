"""
Kisan.JI AI Brain - OpenRouter primary, Gemini fallback
"""
import os, logging, requests
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

LANGUAGE_MAP = {
    'hi': 'Hindi', 'en': 'English', 'mr': 'Marathi', 'gu': 'Gujarati',
    'pa': 'Punjabi', 'ta': 'Tamil', 'te': 'Telugu', 'kn': 'Kannada',
    'bn': 'Bengali', 'ur': 'Urdu', 'ml': 'Malayalam',
}

SYSTEM_PROMPT = """You are Kisan.JI, an expert Indian agriculture consultant.
Reply in the SAME language the user writes in. Keep answers 2-3 sentences max.
Topics: crop diseases, fertilizers, pest control, irrigation, weather,
govt schemes (PM-KISAN, PMFBY), mandi prices. Redirect non-farming to agriculture."""

OPENROUTER_KEY = os.environ.get('OPENROUTER_KEY', '')
OPENROUTER_MODEL = "mistralai/mistral-7b-instruct:free"


class AgriBrain:
    def __init__(self):
        self.gemini_client = None
        self.gemini_types = None
        gemini_key = os.environ.get('GEMINI_API_KEY', '')
        if gemini_key and gemini_key not in ('PASTE_YOUR_KEY_HERE', ''):
            try:
                from google import genai
                from google.genai import types
                self.gemini_client = genai.Client(api_key=gemini_key)
                self.gemini_types = types
                logger.info("✅ Gemini Brain loaded")
            except Exception as e:
                logger.warning(f"Gemini unavailable: {e}")
        logger.info(f"✅ AgriBrain ready (OpenRouter: {OPENROUTER_MODEL})")

    def _ask_openrouter(self, question: str, lang: str) -> str:
        lang_name = LANGUAGE_MAP.get(lang, 'English')
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://kisanji.app",
                "X-Title": "Kisan.JI",
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"[Language: {lang_name}] {question}"}
                ],
                "max_tokens": 300,
            },
            timeout=20
        )
        data = resp.json()
        if resp.status_code == 200 and data.get('choices'):
            return data['choices'][0]['message']['content'].strip()
        raise Exception(data.get('error', {}).get('message', 'OpenRouter error'))

    def ask_bot(self, user_question: str, detected_language: str = 'en') -> str:
        if self.gemini_client:
            try:
                lang = LANGUAGE_MAP.get(detected_language, 'English')
                resp = self.gemini_client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=f"Language: {lang}\n\n{user_question}",
                    config=self.gemini_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
                )
                return resp.text
            except Exception as e:
                logger.warning(f"Gemini failed, using OpenRouter: {e}")
        try:
            return self._ask_openrouter(user_question, detected_language)
        except Exception as e:
            logger.error(f"❌ OpenRouter error: {e}")
            return {'hi': 'कृपया दोबारा पूछें।', 'en': 'Please try again.'}.get(detected_language, 'Please try again.')

    def get_crop_advice(self, crop: str, issue: str, lang: str = 'en') -> str:
        return self.ask_bot(f"Best treatment for {issue} in {crop}?", lang)

    def get_weather_advice(self, weather: str, crop: str, lang: str = 'en') -> str:
        return self.ask_bot(f"Given {weather} weather, precautions for {crop}?", lang)


agri_brain = AgriBrain()

if __name__ == '__main__':
    b = AgriBrain()
    print(b.ask_bot('Best fertilizer for wheat?', 'en'))
    print(b.ask_bot('गेहूं के लिए सबसे अच्छा खाद?', 'hi'))
