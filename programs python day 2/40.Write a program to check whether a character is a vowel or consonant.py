a=input()
if a.isalpha():
    if(a.lower() in ["a","e","i","o","u"]):
        print(a,"is vowel")
    else:
        print(a,"is consonant")
else:
    print(a,"is not an alphabet")
    