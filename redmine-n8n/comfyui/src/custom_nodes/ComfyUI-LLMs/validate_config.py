#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配置验证脚本
用于检查 settings.yaml 文件是否正确配置
"""

import os
import sys
from settings import load_settings, get_chat_settings, get_vision_settings

def validate_config():
    """验证配置文件"""
    print("🔍 正在验证配置文件...")
    
    try:
        # 1. 检查配置文件是否存在
        config_path = os.path.join(os.path.dirname(__file__), "settings.yaml")
        if not os.path.exists(config_path):
            print("❌ 错误: settings.yaml 文件不存在")
            print("💡 请先运行: cp settings.yaml.sample settings.yaml")
            return False
        
        # 2. 测试配置加载
        config = load_settings()
        print("✅ 配置文件加载成功")
        
        # 3. 验证必需的配置节
        required_sections = ['openai_compatible', 'vision_models', 'example_user_prompt']
        for section in required_sections:
            if section not in config:
                print(f"❌ 错误: 缺少必需的配置节 '{section}'")
                return False
        print("✅ 所有必需的配置节都存在")
        
        # 4. 验证聊天配置
        chat_config = get_chat_settings()
        print(f"📝 聊天配置:")
        print(f"   - API端点: {chat_config['api_base']}")
        print(f"   - API密钥: {chat_config['api_key'][:10]}...")
        print(f"   - 可用模型数量: {len(chat_config['model'])}")
        
        # 5. 验证视觉模型配置
        vision_types = ['openai', 'glm4', 'ali', 'gemini']
        print(f"🎯 视觉模型配置:")
        for vtype in vision_types:
            vision_config = get_vision_settings(vtype)
            if vision_config:
                print(f"   - {vtype}: {len(vision_config['model_list'])} 个模型")
            else:
                print(f"   - {vtype}: 未配置")
        
        # 6. 检查API密钥是否为默认值
        if chat_config['api_key'] == 'sk-xxxxxxx':
            print("⚠️  警告: 聊天API密钥仍为默认值，请更新为实际密钥")
        
        for vtype in vision_types:
            vision_config = get_vision_settings(vtype)
            if vision_config and vision_config.get('api_key', '').startswith(('sk-xxxxx', 'xxxxxx', 'AIxxxxxx')):
                print(f"⚠️  警告: {vtype} API密钥仍为默认值，请更新为实际密钥")
        
        print("\n🎉 配置验证完成！")
        return True
        
    except Exception as e:
        print(f"❌ 配置验证失败: {str(e)}")
        return False

def main():
    """主函数"""
    print("ComfyUI-LLMs 配置验证工具")
    print("=" * 40)
    
    if validate_config():
        print("✅ 配置验证通过，您的设置文件已正确配置！")
    else:
        print("❌ 配置验证失败，请检查并修正配置文件")
        sys.exit(1)

if __name__ == "__main__":
    main() 