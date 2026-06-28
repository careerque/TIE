import os
import time
import logging
from google import genai
from google.genai import types
from openai import OpenAI
from groq import Groq

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("llm_manager")

class LLMManager:
    def __init__(self):
        # Load API keys from environment
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
        
        # Read LLM request timeout limit (default: 20 seconds)
        self.timeout = float(os.getenv("LLM_TIMEOUT", "20.0"))
        
        # Read LLM preference order (default: groq first, fallback to openai, then gemini)
        pref_order = os.getenv("LLM_PREFERENCE_ORDER", "groq,openai,gemini")
        self.preference_order = [p.strip().lower() for p in pref_order.split(",") if p.strip()]
        
        # Setup clients
        self.gemini_client = None
        self.openai_client = None
        self.groq_client = None
        self.ollama_client = None
        
        # Initialize clients if keys are present
        if self.gemini_key:
            try:
                # Set client timeout to configurable limit (in milliseconds)
                self.gemini_client = genai.Client(
                    api_key=self.gemini_key,
                    http_options=types.HttpOptions(timeout=int(self.timeout * 1000))
                )
                logger.info(f"Gemini client successfully initialized with {self.timeout}s timeout limit.")
            except Exception as e:
                logger.error(f"Error initializing Gemini client: {e}")
                
        if self.openai_key:
            try:
                self.openai_client = OpenAI(api_key=self.openai_key)
                logger.info("OpenAI client successfully initialized.")
            except Exception as e:
                logger.error(f"Error initializing OpenAI client: {e}")
                
        if self.groq_key:
            try:
                self.groq_client = Groq(api_key=self.groq_key)
                logger.info("Groq client successfully initialized.")
            except Exception as e:
                logger.error(f"Error initializing Groq client: {e}")

        # Initialize Ollama OpenAI-compatible client
        try:
            self.ollama_client = OpenAI(base_url=self.ollama_base_url, api_key="ollama")
        except Exception as e:
            logger.error(f"Error initializing Ollama client: {e}")

    def generate_report(self, system_instruction: str, user_prompt: str) -> tuple[str, str]:
        """
        Attempts to generate report narrative by looping through the LLM preference list.
        Returns a tuple: (report_text, model_name_used)
        """
        last_exception = None
        
        for provider in self.preference_order:
            logger.info(f"Attempting report generation with provider: {provider}")
            
            # --- GROQ PROVIDER ---
            if provider == "groq":
                if not self.groq_client:
                    logger.warning("Groq client not initialized (missing API key). Skipping.")
                    continue
                # Try preferred Groq models
                for model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
                    try:
                        start_time = time.time()
                        logger.info(f"Calling Groq model: {model}")
                        response = self.groq_client.chat.completions.create(
                            model=model,
                            messages=[
                                {"role": "system", "content": system_instruction},
                                {"role": "user", "content": user_prompt}
                            ],
                            temperature=0.3,
                            timeout=min(12.0, self.timeout)  # Adaptive fast timeout for Groq
                        )
                        duration = time.time() - start_time
                        logger.info(f"Groq generation successful with model {model} in {duration:.2f}s")
                        return response.choices[0].message.content, f"Groq/{model}"
                    except Exception as e:
                        logger.error(f"Groq error with model {model}: {e}")
                        last_exception = e

            # --- OPENAI PROVIDER ---
            elif provider == "openai":
                if not self.openai_client:
                    logger.warning("OpenAI client not initialized (missing API key). Skipping.")
                    continue
                try:
                    start_time = time.time()
                    model = "gpt-4o-mini"
                    logger.info(f"Calling OpenAI model: {model}")
                    response = self.openai_client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system_instruction},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.3,
                        timeout=self.timeout  # Configurable timeout
                    )
                    duration = time.time() - start_time
                    logger.info(f"OpenAI generation successful with model {model} in {duration:.2f}s")
                    return response.choices[0].message.content, f"OpenAI/{model}"
                except Exception as e:
                    logger.error(f"OpenAI error: {e}")
                    last_exception = e

            # --- GEMINI PROVIDER ---
            elif provider == "gemini":
                if not self.gemini_client:
                    logger.warning("Gemini client not initialized (missing API key). Skipping.")
                    continue
                # Prefer gemini-2.5-flash directly as lite returns 503 errors
                for model in ["gemini-2.5-flash"]:
                    try:
                        start_time = time.time()
                        logger.info(f"Calling Gemini model: {model}")
                        response = self.gemini_client.models.generate_content(
                            model=model,
                            contents=user_prompt,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction,
                                temperature=0.3,
                            )
                        )
                        duration = time.time() - start_time
                        logger.info(f"Gemini generation successful with model {model} in {duration:.2f}s")
                        return response.text, f"Gemini/{model}"
                    except Exception as e:
                        logger.error(f"Gemini error with model {model}: {e}")
                        last_exception = e

            # --- OLLAMA PROVIDER ---
            elif provider == "ollama":
                try:
                    start_time = time.time()
                    model = os.getenv("OLLAMA_MODEL", "llama3")
                    logger.info(f"Calling local Ollama model: {model}")
                    response = self.ollama_client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system_instruction},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.3,
                        timeout=self.timeout  # Configurable timeout
                    )
                    duration = time.time() - start_time
                    logger.info(f"Ollama generation successful with model {model} in {duration:.2f}s")
                    return response.choices[0].message.content, f"Ollama/{model}"
                except Exception as e:
                    logger.error(f"Ollama error: {e}")
                    last_exception = e
            
            else:
                logger.warning(f"Unknown LLM provider: {provider}")

        # If we went through all providers and failed
        raise Exception(f"All configured LLM providers failed. Last exception: {last_exception}")
